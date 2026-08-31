# Claude Code Guidelines for HYROX Coach AI

This file defines how Claude should work on this project.

## Build Process

**Always follow `BUILD_ORDER.md`** — it is the source of truth for what to build and in what order.

### Standards & Constraints

Hard constraints that must never be violated:

1. **Immutable completed sessions** — [FR-A02, PRD 11]
2. **No workload stacking** — Missed sessions never increase future load [FR-A04]
3. **No post-race sessions** — Sessions must never be scheduled on/after race date [PRD 11]
4. **Guardrail gate** — Plan generation refuses to run against unapproved RuleSet or EventStandardSet
5. **Red-flag safety response** — Pauses generation, shows professional help, never silently downgrades [FR-G10, US-04]
6. **Structured over free-text** — Prefer structured enums for health fields [PRD 12.2]
7. **No sensitive data in logs** — Weight, mobility, pain never enter logs/analytics/URLs [PRD 12.2, 12.5]

### Units

- **Duration:** seconds everywhere internally (use `src/lib/units.ts` to parse/format)
- **Weight:** grams everywhere internally
- **Distance:** metres everywhere internally
- Convert only at the UI boundary

### Commit Messages

Format: `[T-XX] short description`  
Example: `[T-06] Predictor input validation with Zod schema`

One task per commit. Ensure `npm run typecheck` and `npm test` pass before committing.

### Code Style

- TypeScript strict mode always
- No new dependencies without flagging first
- Server components by default; use `"use client"` only for interactivity
- Keep medical language precise: never assert readiness, never guarantee times, never diagnose
- Include requirement IDs (FR-P01, US-03) in comments where constraints would look arbitrary

## Working with Requirements

The PRD is the source of truth. When the BUILD_ORDER disagrees with the PRD, the PRD wins and the BUILD_ORDER should be corrected.

Reference key sections:
- **Appendix A:** Onboarding flow (6 steps)
- **Appendix C:** Disclaimer text (copy verbatim)
- **Section 11:** Guardrail rules and constraints
- **Section 12:** Privacy and safety governance
- **Section 14:** Entity definitions (Prisma model naming)

## Testing

- `npm test` must pass before every commit
- `npm run typecheck` must pass before every commit
- Write tests for all validation paths
- Property tests for edge cases (degenerate horizons, overlapping phases, etc.)

## Database

- Prisma migrations: `npm run db:migrate`
- Seeding: `npm run db:seed`
- Studio: `npm run db:studio`

Seed data includes:
- 8 HYROX stations (with null loads = unapproved [T-05])
- 5 divisions
- Placeholder EventStandardSet (unapproved)
- Placeholder RuleSet (unapproved)

## Deployment Notes

Phase 0 (foundation) is complete when:
- ✅ Database schema is created and seeded
- ✅ Unit system is canonical and tested
- ✅ Station data is seeded
- ✅ Project structure is CI-ready

Do not proceed to Phase 1 without passing CI checks.

## Questions & Blockers

If a task cannot be completed as written:
1. **Stop** and explain why
2. **Do not substitute** something that looks similar
3. **Flag blocked tasks** clearly

Blocked tasks in BUILD_ORDER have "Blocked on" sections — check them before starting.

## Reminders

- Medical language is critical — use the exact wording from PRD Appendix C for disclaimers
- Placeholder values (loads, standards, ruleset thresholds) must be clearly marked as unapproved
- Sensitive data (weight, pain, mobility detail) must never reach telemetry or URLs
- Immutability is enforced at the data layer, not just the UI
