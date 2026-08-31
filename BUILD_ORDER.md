# HYROX Coach AI — Build Order

Working document for Claude Code. Read this before starting any task.

Source of truth for requirements is `HYROX_Personalized_Training_PRD.md`. This file
is the execution order and the acceptance criteria; when the two disagree, the PRD
wins and this file should be corrected.

---

## How to work through this

- Tasks are ordered. Later tasks assume earlier ones exist. Don't skip ahead
  without saying so.
- Do one task per commit. Commit message format: `[T-12] short description`.
- Every task lists **Done when** criteria. All of them must pass before moving on.
- `npm run typecheck` and `npm test` must be clean at the end of every task.
- Requirement IDs in brackets (FR-P01, US-03, PRD 11) point at the PRD. Keep them
  in code comments where a constraint would otherwise look arbitrary — this
  product needs traceability from behaviour back to requirement.
- If a task can't be completed as written, stop and explain why rather than
  substituting something that looks similar.

## Project conventions

- **Stack:** Next.js 15 App Router, TypeScript strict, PostgreSQL via Prisma 6,
  Zod for input validation, Vitest for tests.
- **Units:** seconds, grams, metres. Everywhere. Convert only at the UI boundary
  using `src/lib/units.ts`. Nothing else parses a duration string.
- **Naming:** Prisma models match PRD section 14 entity names exactly.
- **Server components by default.** Add `"use client"` only for genuine
  interactivity.
- **No new dependencies** without flagging it first.
- **Safety language:** never assert medical readiness, never guarantee a finish
  time, never diagnose. Copy that touches health goes through the wording already
  established in the PRD disclaimer (Appendix C).

## Hard constraints — do not violate these in any task

1. Completed sessions are immutable. Adaptation touches future sessions only.
   [FR-A02, PRD 11]
2. Missed workload is never stacked onto later sessions. [FR-A04, PRD 11]
3. No session is ever scheduled on or after the competition date. [PRD 11]
4. Plan generation must refuse to run against an unapproved `RuleSet` or
   `EventStandardSet`. Approval is `approvedBy` + `approvedAt` being non-null.
5. A red-flag safety response pauses generation and shows professional-help
   messaging. It never downgrades silently and continues. [FR-G10, US-04]
6. Free-text health fields are a last resort. Prefer the structured enums.
   [PRD 12.2]
7. Sensitive values (weight, mobility, pain) never enter logs, analytics, or URL
   query strings. [PRD 12.2, 12.5]

---

## Phase 0 — Foundation ✅ COMPLETE

Already built. Read these files before writing anything new.

| Task | Status | Where |
|---|---|---|
| T-01 Project scaffold, CI-ready config | done | `package.json`, `tsconfig.json`, `next.config.mjs` |
| T-02 Database and migration tooling | done | `prisma/`, `docker-compose.yml`, `scripts/setup.sh` |
| T-03 Full schema, all PRD entities | done | `prisma/schema.prisma` |
| T-04 Canonical unit system + tests | done | `src/lib/units.ts`, `src/lib/units.test.ts` |
| T-05 Seeded stations, divisions, standards, ruleset | done | `src/lib/domain/stations.ts`, `prisma/seed.ts` |

Two seeded artifacts are **unapproved placeholders** and block launch, not
development: station loads are null, and guardrail values in the ruleset have no
professional sign-off. Build against them, but implement constraint 4 above so
they cannot silently reach a real athlete.

---

## Phase 1 — Predictor (public, no auth)

Goal: a stranger can land on the site, enter seven fields, and get a credible
finish-time range with an honest account of how confident it is.

### T-06 — Predictor input schema and validation

Zod schema for the PRD 7.1 inputs: age, category, weight + unit, 5 km time +
recency band, competition date, division, optional target time, optional prior
HYROX result.

- Validation runs on both client and server from the same schema.
- Competition date must be future-dated and within the supported planning
  horizon (define a constant, document it, flag it as PRD open question 13).
- Weight uses `WEIGHT_BOUNDS_GRAMS`; durations parse via `parseDuration`.
- Errors are per-field and human-readable.

**Done when:** invalid input produces a field-level message, not a thrown error
[FR-P02, US-01 criterion 2]; unit tests cover each rejection path.

### T-07 — Rules-based estimator

`src/lib/predictor/`. Pure functions, no database access, no I/O.

Returns: `{ lowSeconds, highSeconds, confidence, drivers[], dataQualityWarnings[],
goalGapLabel, modelVersion }`.

- A **range**, never a point estimate. [FR-P03]
- Confidence is derived from input completeness and recency — a prior HYROX
  result raises it, a stale 5 km time lowers it. [FR-P04]
- `drivers` is an ordered list of the largest contributors with plain-language
  labels. [FR-P05]
- `goalGapLabel` uses only `WITHIN_RANGE` / `STRETCH` /
  `REQUIRES_MORE_EVIDENCE`. [FR-P08]
- `modelVersion` is a constant exported from the module and stored with every
  estimate.
- No ranking or percentile claims. [PRD 9.1 governance]

**Note:** the estimator's actual coefficients are a product decision, not a
coding one. Implement the structure with clearly-labelled placeholder
coefficients in one exported constant, and make the module easy to swap. Do not
invent numbers that look authoritative.

**Done when:** tests cover a complete-input case, a sparse-input case (lower
confidence, wider range), and confirm the range always contains the point
estimate; the module has zero imports from `@/lib/db`.

### T-08 — Predictor form and result page

Public route. Server action calls the estimator, persists a `Prediction` row with
`athleteId: null`.

Result shows: the range, confidence with a plain-language explanation, gap to
target, key drivers, data-quality warnings, the non-guarantee notice, and a CTA
to create an account and build a plan.

**Done when:** all five US-01 acceptance criteria pass; no account is required to
see a result; the disclaimer is present and not collapsed behind a toggle.

### T-09 — Abuse controls

Rate limit the public predictor endpoint by IP and by session. Prevent scraping
and enumeration. [PRD 12.2, US-01 criterion 5]

**Done when:** exceeding the limit returns a clear message rather than a generic
500; the limit is configurable.

### T-10 — Recalculation on input change

Editing a valid input updates the estimate without a full page reload, writing a
new `Prediction` row rather than mutating the old one. [FR-P09]

---

## Phase 2 — Accounts and onboarding

### T-11 — Authentication

Register, sign in, sign out, password recovery, account deletion. Sessions,
password hashing, CSRF protection. Roles: `ATHLETE`, `ADMIN` (`COACH` exists in
the schema but is not exposed). [PRD 9.6]

**Done when:** deletion actually removes or anonymises athlete data per the
schema's cascade rules, and is covered by a test.

### T-12 — Consent capture

Write `Consent` rows for terms, privacy, and safety disclaimer at signup, with
document version. Withdrawal writes a new row rather than mutating. Sensitive
profile data requires its own consent with an explanation of why it's collected.
[PRD 12.2, FR-P07]

**Done when:** a withdrawn consent leaves the original grant row intact and
queryable.

### T-13 — Claim the anonymous prediction

On signup, attach the visitor's most recent `Prediction` to the new account —
only after explicit consent. [FR-P07]

### T-14 — Onboarding flow

Appendix A steps 5–10, one step per screen, resumable:

1. Ranked top-three hardest stations — ranks 1–3, no duplicates [US-02]
2. Athletic background and current weekly load
3. Work pattern and physical demand
4. Mobility and pain screening (see T-15)
5. Equipment access
6. Day-by-day availability in minutes [US-03]

**Done when:** the DB constraints do the enforcing (try inserting a duplicate
rank and confirm it fails); progress survives a page refresh.

### T-15 — Safety screening and red-flag gate

Distinguish `LIMITED_MOBILITY` from `ACTIVE_PAIN`. [PRD 11] Screening rules set
`redFlag`, never the athlete directly.

A red flag must:
- prevent generation of affected high-risk guidance,
- show professional-clearance messaging in the PRD's neutral wording,
- write an `AuditEvent` without copying sensitive detail into metadata.
[US-04, FR-G10]

**Done when:** a red-flag profile cannot reach plan generation by any route,
including direct URL access; there is a test that asserts this.

**Blocked on:** the accountable professional defining what actually triggers a
hard stop [PRD open question 12]. Implement the mechanism with clearly-marked
placeholder trigger conditions in the ruleset config.

---

## Phase 3 — Plan engine

**Gate:** do not ship any of this to real users until the ruleset and standard set
carry recorded professional approval.

### T-16 — Workout template catalog and admin CRUD

Admin console for `WorkoutTemplate`, `TemplateSubstitution`, station standards,
and rulesets. Approval is an explicit action that records approver and timestamp
and writes an `AuditEvent`. Templates in `DRAFT` or `PENDING_APPROVAL` are never
selectable by the generator. [PRD 9.6, 9.3]

### T-17 — Phase calculation

Divide plan start → competition date into FOUNDATION, DEVELOPMENT, RACE_SPECIFIC,
PEAK, TAPER, RACE_WEEK. Lengths are rules-driven and bounded by weeks available.
[FR-G02]

**Done when:** handles the degenerate cases — race in 10 days, race in 40 weeks —
without producing zero-length or overlapping phases; property tests cover a range
of horizons.

### T-18 — Session allocation

Place sessions inside declared per-day availability. Never exceed a day's minutes
without explicit user action. Surface a neutral warning when target and available
time look misaligned. [FR-G03, US-03 criteria 2–3]

### T-19 — Session balancing

Distribute across running, strength, station skill, combined/compromised running,
mobility, recovery. Raise emphasis on the three ranked stations without dropping
required preparation for the other five. [FR-G04, FR-G05, US-02 criterion 4]

### T-20 — Guardrail layer

Implement PRD 11 as an explicit, independently testable rule layer that the
generator's output passes through — not as conditionals scattered through
allocation.

Reads all thresholds from `RuleSet.config`. Enforces: progression caps, minimum
recovery, taper rules, no post-race-date sessions, equipment filtering,
occupational load, no workload stacking.

**Done when:** every rule has a test that constructs a violating plan and asserts
the layer rejects or corrects it; the layer refuses to run against an unapproved
ruleset.

### T-21 — Rationale and traceability

Every session gets a plain-language rationale connecting it to the athlete's
profile. [FR-G09] Every session persists `templateVersion` and `ruleSetVersion`.
[PRD 12.4] The plan persists `generationRationale` and `assumptions` for the
pre-acceptance review screen.

**Done when:** given a session ID, you can reconstruct exactly which template
version and ruleset version produced it.

### T-22 — Idempotence

Same inputs + same versions produce the same plan, or explicitly version a new
result. [PRD 12.1]

---

## Phase 4 — Athlete experience

### T-23 — Calendar view
Plan by week and month, phase-aware, showing rest days as deliberate rather than
empty.

### T-24 — Daily workout detail
Title, purpose, duration, equipment, warm-up / main / cooldown, intensity
guidance, substitutions with an explanation of any lost race specificity, safety
notes and stop conditions, completion controls. [PRD 9.3]

### T-25 — Post-session check-in
Completion state, RPE, actual minutes, pain/mobility flag with neutral severity
language, substitutions performed, optional notes. Writing a check-in sets
`TrainingSession.locked`. [FR-A01, PRD 7.3]

### T-26 — Burn-down dashboard
Days and weeks remaining, current phase, planned vs completed sessions and
minutes for the week, next key session, recovery days, benchmark progress,
adherence. [FR-D01–D05]

Status uses a transparent "preparation status" label with an explanation, never
an unvalidated readiness score, never implying medical clearance. [FR-D06, US-05
criterion 3] Show recent plan changes with reasons [FR-D07] and risk flags for
repeated skips, sustained high effort, pain reports, compressed time [FR-D08].

**Done when:** status is legible without colour [PRD 12.3]; completing a session
updates the dashboard immediately [US-05 criterion 2].

---

## Phase 5 — Adaptation

### T-27 — Immutability enforcement
Locked sessions reject writes at the data-access layer, not just in the UI.
[FR-A02]

### T-28 — Recalculation triggers
New benchmark, schedule change, missed sessions, extended interruption, equipment
change, user-moved session. Only future sessions change. Bump plan version, write
a `PlanAdjustment` with a structured diff. [FR-G11, FR-G12, FR-A03]

**Done when:** there is a test asserting that missed sessions never increase
future workload. [FR-A04]

### T-29 — Accept or reject material changes
Material adjustments go to `PENDING` and wait for the athlete. Non-material ones
apply as `AUTO_APPLIED`. Define and document the materiality threshold. [FR-A06]

### T-30 — Safety pause
A pain report meeting the ruleset's threshold moves the plan to
`PAUSED_FOR_SAFETY`. No recalculation occurs while paused. Resuming requires an
explicit action. [FR-A05]

---

## Phase 6 — Launch readiness

### T-31 — Data export and deletion
Machine-readable export of profile, plan, and history. Deletion, correction, and
consent withdrawal workflows. [PRD 9.6, 12.2]

### T-32 — Accessibility
WCAG 2.2 AA. Keyboard navigation, visible focus, semantic headings, screen-reader
labels, accessible validation messages, contrast, no colour-only status, plain
language with training terms defined, both unit systems. [PRD 12.3]

**Done when:** an automated pass is clean and predictor → onboarding → dashboard
→ session has been walked keyboard-only.

### T-33 — Observability
Log prediction requests with model version, latency, and outcome. Monitor
plan-generation failures, safety-trigger rates, error patterns by cohort. Assert
in a test that sensitive input values never reach logs. [PRD 12.4]

### T-34 — Analytics
Funnel instrumentation for predictor starts, completions, predictor-to-account,
account-to-plan. Health, mobility, exact weight, and fine-grained profile values
must never reach advertising platforms. Consent-gated. [PRD 12.5, 16]

---

## Deferred — do not build in MVP

Notifications, expanded benchmark testing, plan download/print, wearable
integrations, coach portal, race-result import, native apps, nutrition, social
features, multi-event planning. [PRD 4.2, 15]

## Open questions that block specific tasks

| # | Question | Blocks |
|---|---|---|
| 5 | Are under-18 athletes excluded? | T-06 |
| 9 | Which inputs may the model use, after fairness/privacy review? | T-07 |
| 10 | Fallback when confidence is too low? | T-07 |
| 11 | Who is the accountable professional approving content and guardrails? | T-16, Phase 3 gate |
| 12 | What triggers a hard stop vs. substitution vs. clearance message? | T-15 |
| 13 | Supported planning horizon when race day is very close or distant? | T-06, T-17 |
| 15 | Which equipment substitutions are safe and race-specific enough? | T-16 |

Where a task is blocked, build the mechanism with clearly-labelled placeholders in
configuration, never hardcoded, and never with invented values that read as
authoritative.
