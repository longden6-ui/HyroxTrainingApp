# HYROX Coach AI — Architecture & System Design

**Status:** Phase 0 Complete | Phase 1-4 In Development  
**Last Updated:** September 1, 2026

---

## Project Overview

**HYROX Coach AI** is a personalized training platform designed to help athletes prepare for HYROX obstacle course races. The application combines a public predictor tool (for unauthenticated users), a comprehensive training plan generator (for registered athletes), and an adaptive coaching experience that evolves based on performance and feedback.

### Core Value Proposition

Given an athlete's profile, fitness level, and availability, generate a credible, personalized training plan that progresses through structured phases, adapts to real-world constraints, and provides transparent rationale for every recommendation.

### Key Principles

- **Safety First:** Medical language is precise, never advisory. Red flags pause generation; never downgrade silently.
- **Immutability:** Completed sessions cannot be modified; adaptation only touches future sessions.
- **Transparency:** Every session, phase, and plan adjustment includes plain-language rationale.
- **Structured Data:** Prefer enums and structured fields over free-text health data.
- **Privacy:** Weight, pain, and mobility details never enter logs, analytics, or URLs.

---

## Technology Stack

### Backend & Framework

| Component | Technology | Notes |
|-----------|-----------|-------|
| Runtime | Next.js 15 App Router | TypeScript strict mode, server components by default |
| Database | PostgreSQL via Prisma 6 | Migrations managed via Prisma, Docker Compose for local dev |
| Validation | Zod | Schema validation, shared client/server validation |
| Testing | Vitest | Unit & integration tests, property-based testing |

### Frontend

| Component | Technology | Notes |
|-----------|-----------|-------|
| UI Library | React 18/19 RC | Server components by default, "use client" only for interactivity |
| Styling | CSS Modules (planned) | Responsive design, dark mode support (planned) |

### Core Dependencies

```json
{
  "@prisma/client": "^6.0.0",      // Database ORM
  "next": "15.0.0",                 // Framework & routing
  "react": "^18.2.0",               // UI library
  "zod": "^3.22.0",                 // Schema validation
  "bcryptjs": "^2.4.3"              // Password hashing
}
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Client                         │
│ (Public Predictor│Auth│Onboarding│Dashboard)               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│         Next.js App Router (Server Components)              │
│ ├─ Pages & Layouts                                         │
│ ├─ Server Actions (mutations)                              │
│ └─ API Routes (auth, webhooks)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Application Logic Layer                         │
│ ├─ Predictor (rules-based estimator)                       │
│ ├─ Plan Engine (phase calc, allocation, balancing)         │
│ ├─ Guardrail Layer (validation, constraints)               │
│ ├─ Authentication & Sessions                               │
│ └─ Adaptation & Recalculation                              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Prisma ORM Layer                           │
│ (Type-safe database access, migrations, seeding)           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               PostgreSQL Database                           │
│ (Athletes, Plans, Sessions, Consent, Audit Trail)          │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Server Components by Default:** Pages and layouts are server components. Only leaf components use "use client" when they need state or interactivity.
- **Server Actions:** Mutations (form submissions, plan generation) use Next.js server actions for end-to-end type safety.
- **Shared Validation Schemas:** Zod schemas validate both client (optimistic) and server (authoritative) sides from the same definition.
- **Unit-Invariant Core Logic:** All business logic uses canonical units: seconds (duration), grams (weight), metres (distance). Conversion happens only at UI boundaries.
- **Immutable Data Patterns:** Completed sessions are locked at the data layer; adaptation generates new sessions, never mutates existing ones.

---

## Database Schema

### Core Entity Relationships

The schema is organized around the athlete lifecycle: signup → onboarding → plan generation → session completion → adaptation.

#### Athlete

```prisma
model Athlete {
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String?
  role              UserRole @default(ATHLETE)
  
  // Profile data
  firstName         String?
  lastName          String?
  age               Int?
  gender            String?
  weightGrams       Int?
  competitionDate   DateTime?
  targetFinishTime  Int?      // seconds
  division          String?
  priorHyroxResult  String?   // "COMPLETED", "DNF", "NO_PRIOR_RESULT"
  
  // Safety flags
  redFlag           Boolean  @default(false)
  
  // Relationships
  predictions       Prediction[]
  onboarding        Onboarding?
  trainingPlans     TrainingPlan[]
  trainingSessions  TrainingSession[]
  sessionCheckIns   SessionCheckIn[]
  consents          Consent[]
  auditEvents       AuditEvent[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
}
```

#### Prediction

```prisma
model Prediction {
  id                String   @id @default(cuid())
  athleteId         String?  // Nullable for anonymous predictions
  athlete           Athlete? @relation(fields: [athleteId], references: [id], onDelete: SetNull)
  
  // Inputs
  age               Int
  category          String   // "INDIVIDUAL", "TEAM"
  weightGrams       Int
  fiveKmTimeSeconds Int
  fiveKmRecency     String   // "RECENT", "3_MONTHS", "6_MONTHS", "STALE", "NO_DATA"
  competitionDate   DateTime
  division          String
  targetFinishTime  Int?     // seconds
  priorHyroxResult  String?  // "COMPLETED", "DNF", "NO_PRIOR_RESULT"
  
  // Results
  lowSeconds        Int
  highSeconds       Int
  confidence        Float    // 0.0 to 1.0
  drivers           String   // JSON array of {factor: string, label: string, weight: float}
  dataQualityWarnings String? // JSON array
  goalGapLabel      String   // "WITHIN_RANGE", "STRETCH", "REQUIRES_MORE_EVIDENCE"
  modelVersion      String
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([athleteId])
  @@index([createdAt])
}
```

#### TrainingPlan

```prisma
model TrainingPlan {
  id                String   @id @default(cuid())
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  
  // Versions and governance
  version           Int      @default(1)
  status            String   @default("DRAFT")
  // "DRAFT", "PENDING_REVIEW", "ACTIVE", "COMPLETED", "PAUSED_FOR_SAFETY"
  
  // Dates and phases
  startDate         DateTime
  competitionDate   DateTime
  generatedAt       DateTime @default(now())
  
  // Guardrails and template versions
  ruleSetId         String
  ruleSet           RuleSet  @relation(fields: [ruleSetId], references: [id])
  ruleSetVersion    String   // Snapshot of ruleSet.version at generation time
  
  // Generation metadata
  generationRationale String?  // Plain-language why this plan was created
  assumptions       String?  // JSON: athlete inputs and constraints applied
  
  // Phases
  foundationStart   DateTime?
  foundationEnd     DateTime?
  developmentStart  DateTime?
  developmentEnd    DateTime?
  raceSpecificStart DateTime?
  raceSpecificEnd   DateTime?
  peakStart         DateTime?
  peakEnd           DateTime?
  taperStart        DateTime?
  taperEnd          DateTime?
  raceWeekStart     DateTime?
  
  // Sessions
  sessions          TrainingSession[]
  adjustments       PlanAdjustment[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([athleteId])
  @@index([status])
  @@index([createdAt])
}
```

#### TrainingSession

```prisma
model TrainingSession {
  id                String   @id @default(cuid())
  planId            String
  plan              TrainingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  ruleSetId         String
  ruleSet           RuleSet  @relation(fields: [ruleSetId], references: [id])
  
  // Scheduling
  scheduledDate     DateTime
  scheduledHour     Int?
  duration          Int      // seconds
  
  // Content
  templateId        String?  // Null for custom/adaptive sessions
  templateVersion   String?  // Template version at generation
  title             String
  purpose           String   // Plain-language rationale
  
  // Session structure
  primaryFocus      String   // "RUNNING", "STRENGTH", "STATION_SKILL", "COMBINED", "MOBILITY", "RECOVERY"
  warmupDuration    Int?     // seconds
  mainDuration      Int?     // seconds
  cooldownDuration  Int?     // seconds
  
  // Station-specific
  targetStation     String?  // Station name if focused
  
  // Content and guidance
  equipment         String?  // JSON array
  intensityLabel    String?  // "EASY", "MODERATE", "HARD", "RACE_PACE"
  instructions      String?  // Detailed workout steps
  safetyNotes       String?  // Stop conditions, red flags
  
  // Substitutions and adaptations
  performedSubstitution String?
  substitutionReason String?
  
  // Completion state
  locked            Boolean  @default(false) // Immutable when locked
  checkIn           SessionCheckIn?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([athleteId])
  @@index([planId])
  @@index([scheduledDate])
  @@unique([planId, scheduledDate])
}
```

#### SessionCheckIn

```prisma
model SessionCheckIn {
  id                String   @id @default(cuid())
  sessionId         String   @unique
  session           TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  
  // Completion
  completedAt       DateTime
  completionStatus  String   // "COMPLETED", "SKIPPED", "PARTIAL"
  actualDuration    Int?     // seconds; may differ from scheduled
  
  // Feedback
  rpe               Int?     // Rate of Perceived Exertion, 1-10
  mobilityFlag      Boolean  @default(false)
  mobilityNotes     String?  // "GOOD", "LIMITED", "PAIN"; neutral language only
  painFlag          Boolean  @default(false)
  painNotes         String?  // Free-text only as last resort
  
  // Substitutions and adaptations
  performedSubstitution String?
  substitutionReason String?
  
  // Athlete notes
  notes             String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([athleteId])
  @@index([completedAt])
}
```

#### Additional Models

- **Onboarding:** Stores the 6-step profile (stations, background, work pattern, mobility, equipment, availability)
- **Station, Division:** Seeded reference data (8 HYROX stations, 5 divisions)
- **RuleSet, EventStandardSet:** Guardrail thresholds and race benchmarks with approval workflow
- **WorkoutTemplate, TemplateSubstitution:** Reusable session templates with approval and substitutions
- **Consent:** Document version tracking with grant/withdrawal history
- **PlanAdjustment:** Immutable history of plan changes with structured diffs
- **AuditEvent:** Governance trail (predictions, safety flags, consent, locks) without sensitive detail

---

## Directory Structure

```
hyrox-training-app/
├── app/                           # Next.js App Router
│   ├── api/                        # API routes
│   │   └── auth/
│   ├── dashboard/                  # Authenticated athlete dashboard
│   ├── onboarding/                 # 6-step onboarding flow
│   ├── predict/                    # Public predictor (no auth required)
│   ├── signin/, signup/            # Authentication pages
│   ├── profile/                    # Athlete profile page
│   └── layout.tsx                  # Root layout
│
├── src/
│   ├── components/                 # React components
│   │   ├── auth/                   # SigninForm, SignupForm
│   │   ├── layout/                 # PageLayout, Card, Navigation
│   │   ├── athlete/                # SessionCheckIn, CalendarView, WorkoutDetail, BurndownChart
│   │   └── predictor/              # PredictorForm, PredictorResult
│   │
│   └── lib/                        # Business logic & utilities
│       ├── auth/                   # Authentication (schema, jwt, session, password)
│       ├── predictor/              # Rules-based estimator, input validation
│       ├── planning/               # Phase calc, allocation, balancing, guardrails
│       ├── safety/                 # Safety screening, red-flag logic
│       ├── adaptation/             # Recalculation triggers, adjustments
│       ├── athlete/                # Athlete queries & data access
│       ├── templates/              # Workout template management
│       ├── consent/                # Consent tracking
│       ├── onboarding/             # Onboarding state & progress
│       ├── actions/                # Server actions
│       ├── domain/                 # Seeded station data, constants
│       ├── launch/                 # Launch readiness (logging, analytics, export)
│       ├── units.ts                # CANONICAL UNIT SYSTEM
│       ├── units.test.ts           # Unit conversion tests
│       └── ratelimit.ts            # Rate limiting utilities
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── seed.ts                     # Database seeding
│   └── migrations/                 # Generated migration files
│
├── docker-compose.yml              # Local PostgreSQL
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config (strict mode)
├── next.config.mjs                 # Next.js config
├── BUILD_ORDER.md                  # Development roadmap
├── CLAUDE.md                       # Claude Code guidelines
├── ARCHITECTURE.md                 # This file
└── HYROX_Personalized_Training_PRD.md  # Product requirements
```

---

## Application Layers

### 1. Presentation Layer

**Responsibility:** Render UI, handle user interaction, orchestrate navigation.

- **Pages:** Mapped to routes in `app/`; mostly server components
- **Components:** Reusable UI blocks in `src/components/`
- **Styling:** CSS modules (planned); responsive design; accessibility first
- **Forms:** Client-side validation (Zod) + server-side re-validation

### 2. API & Action Layer

**Responsibility:** Handle HTTP requests and server actions (mutations).

- **Server Actions:** Form submissions, plan generation, session check-ins
- **API Routes:** Auth endpoints, webhooks, machine-readable endpoints
- **Session Management:** HTTP-only cookies, CSRF protection
- **Input Validation:** Zod schemas validate all external inputs

### 3. Business Logic Layer

**Responsibility:** Core algorithms, rules, and domain models.

**Key Modules:**

- **Predictor:** Rules-based estimator (range, confidence, drivers, quality warnings)
- **Plan Engine:** Phase calculation, session allocation, balancing, guardrail enforcement
- **Adaptation:** Recalculation triggers, plan adjustments, immutability enforcement
- **Safety:** Red-flag screening, pause logic, professional clearance messaging
- **Consent & Auth:** Consent tracking, session management, RBAC

### 4. Data Access Layer

**Responsibility:** Type-safe database queries and transaction management.

- **Prisma Client:** ORM for all database access
- **Queries:** Located in `src/lib/athlete/` and feature-specific folders
- **Constraints:** Database-level constraints enforce immutability and data integrity
- **Migrations:** Managed via `prisma migrate`; seeding via `prisma/seed.ts`

### 5. Infrastructure Layer

**Responsibility:** Logging, monitoring, auth, rate limiting.

- **Authentication:** Password hashing (bcryptjs), JWT, session cookies
- **Rate Limiting:** Per-IP and per-session limits on public endpoints
- **Logging:** Structured logging; never logs sensitive values
- **Observability:** Audit trail via `AuditEvent` model; error tracking (planned)

---

## Key Modules & Systems

### Predictor Module

**Location:** `src/lib/predictor/`

**Purpose:** Generate credible finish-time estimates for unauthenticated users.

**Inputs (7 fields):**
- Age, weight (with unit), 5 km time (with recency band)
- Competition date, division, category (individual/team)
- Optional: prior HYROX result, target finish time

**Outputs:**
- Range (low/high finish time in seconds)
- Confidence (0.0–1.0, derived from input completeness)
- Drivers (top contributors to the estimate, with plain-language labels)
- Data quality warnings (e.g., "5 km time is 9 months old")
- Goal gap label: WITHIN_RANGE | STRETCH | REQUIRES_MORE_EVIDENCE
- Model version (constant, for traceability)

**Key Principles:**
- Pure functions; no I/O or database access
- Placeholder coefficients clearly marked (not invented authority)
- No ranking or percentile claims
- Stores all predictions (including anonymous) for learning

### Plan Engine

**Location:** `src/lib/planning/`

**Purpose:** Transform athlete profile into a personalized 12-week training plan.

**Pipeline:**

1. **Phase Calculation:** Divide (start → competition date) into FOUNDATION, DEVELOPMENT, RACE_SPECIFIC, PEAK, TAPER, RACE_WEEK
2. **Session Allocation:** Respect daily availability constraints; never exceed without explicit action
3. **Session Balancing:** Distribute across running, strength, station skill, mobility, recovery; emphasize top-3 stations
4. **Guardrail Layer:** Enforce PRD 11 rules (progression caps, recovery, taper, no post-race sessions, equipment filtering, no workload stacking)
5. **Rationale Generation:** Attach plain-language explanation to every session

**Outputs:**
- TrainingPlan with version, status, phase dates
- TrainingSession records with template version, ruleset version, purpose, structure
- Assumptions JSON (athlete inputs, constraints applied)

### Adaptation System

**Location:** `src/lib/adaptation/`

**Purpose:** Detect changes (schedule, missed sessions, equipment, pain reports) and recalculate future sessions only.

**Triggers:**
- New benchmark result
- Schedule change (availability updated)
- Missed session (marked SKIPPED)
- Extended interruption (3+ consecutive skipped sessions)
- Equipment access change
- Athlete manually moved a session

**Constraint:** Missed workload is never stacked onto future sessions. Future load is recalculated from scratch, not compounded.

**Outputs:**
- New TrainingPlan version (immutable previous versions retained)
- PlanAdjustment record with structured diff and reason
- Material changes go to PENDING; non-material auto-apply

### Safety & Guardrails

**Location:** `src/lib/safety/`, `src/lib/planning/guardrails.ts`

**Purpose:** Enforce medical safety constraints and respond to red flags.

**Red Flag Screening:**
- Distinguish ACTIVE_PAIN from LIMITED_MOBILITY
- Set `Athlete.redFlag = true` via automated screening rules
- Red-flagged athletes cannot reach plan generation (enforced at all entry points)
- Shows professional-help messaging in PRD-approved neutral wording
- Audit logged without copying sensitive details

**Guardrail Enforcement:**
- Progression caps (max weekly load increase)
- Minimum recovery days per week
- Taper rules (reduced load in final 2 weeks)
- Equipment filtering (only use available equipment)
- Occupational load consideration (work demand + training load)
- No sessions on or after competition date

### Authentication & Consent

**Location:** `src/lib/auth/`, `src/lib/consent/`

**Features:**
- Email/password signup & signin; password recovery (planned)
- HTTP-only session cookies; CSRF protection
- Roles: ATHLETE, COACH (not exposed), ADMIN
- Consent tracking with document version and withdrawal history
- Withdrawal writes a new row (immutable history)
- Account deletion cascades and anonymizes athlete data

### Unit System

**Location:** `src/lib/units.ts`

**Canonical Units:**
- **Duration:** seconds everywhere internally
- **Weight:** grams everywhere internally (30–200 kg bounds)
- **Distance:** metres everywhere internally

**Conversion Only at Boundaries:**
- Parse user input via `parseDuration()` at form boundary
- Format for display at UI boundary (use `formatDuration()`)
- All internal functions assume canonical units

---

## Data Flows

### Public Prediction Flow

```
User enters 7 fields (form validation)
        ↓
Server action validates (Zod)
        ↓
Estimator computes range & confidence
        ↓
Prediction row stored (athleteId = null for anonymous)
        ↓
Result page shows range, drivers, warnings
        ↓
On input change: new Prediction created (not mutated)
```

### Signup & Onboarding Flow

```
User signs up (email, password)
        ↓
Athlete record created, role = ATHLETE
        ↓
Consent rows written (TERMS, PRIVACY, SAFETY_DISCLAIMER)
        ↓
Claim prediction from anonymous session
        ↓
6-step onboarding (resumable, stored in Onboarding model)
        ↓
Safety screening (automated rules check for red flags)
        ↓
If red flag: Athlete.redFlag = true, professional-help message
        ↓
Complete: ready for plan generation or sign-off
```

### Plan Generation Flow

```
Athlete clicks "Generate Plan"
        ↓
Guardrail gate: RuleSet & EventStandardSet must be approved
        ↓
Red-flag check: if flagged, refuse to proceed
        ↓
Phase calculation (6 phases, dates computed)
        ↓
Session allocation (respect availability, warn if misaligned)
        ↓
Session balancing (distribute across focus types)
        ↓
Guardrail enforcement (progression, recovery, taper, etc.)
        ↓
Rationale generation (attach purpose to every session)
        ↓
TrainingPlan + TrainingSession records persisted
        ↓
Athlete sees plan summary, version 1
```

### Session Completion & Adaptation Flow

```
Athlete completes scheduled session
        ↓
Post-session check-in (RPE, actual duration, pain flag)
        ↓
SessionCheckIn record written, TrainingSession.locked = true
        ↓
AuditEvent logged (no sensitive detail)
        ↓
Adaptation trigger detected (e.g., missed sessions, new benchmark)
        ↓
Recalculation: generate new TrainingPlan version
        ↓
PlanAdjustment written (reason, diff, materiality)
        ↓
If material: Athlete sees "Plan Changed" prompt, approves or rejects
        ↓
If auto-applied: Updated sessions appear in dashboard
```

---

## Hard Constraints & Design Patterns

### Immutability

**Completed sessions are immutable.** When a SessionCheckIn is written, TrainingSession.locked is set to true. The data layer rejects any further writes. Adaptation only touches future sessions; never mutates the past. [FR-A02, Constraint 1]

### No Workload Stacking

**Missed workload is never stacked.** If an athlete misses a session, future sessions are not increased to compensate. The recalculation regenerates the entire future plan from scratch, respecting the constraint that future load must be achievable. [FR-A04, Constraint 2]

### No Post-Race Sessions

**No session is ever scheduled on or after the competition date.** This is enforced at plan generation and validated on every recalculation. [PRD 11, Constraint 3]

### Guardrail Gate

**Plan generation must refuse to run against unapproved RuleSet or EventStandardSet.** Approval is recorded via approvedBy + approvedAt (both non-null). If missing, plan generation pauses and shows a message. [Constraint 4]

### Red-Flag Safety

**Red-flag response pauses generation and shows professional-help messaging. Never downgrade silently.** If a safety check fails, the system explicitly stops, shows the PRD-approved neutral wording, and logs an AuditEvent. [FR-G10, US-04, Constraint 5]

### Structured Over Free-Text

**Prefer structured enums for health fields.** Pain and mobility status use enums (GOOD, LIMITED, PAIN) and flag fields. Free-text is only a fallback when absolutely necessary. [PRD 12.2, Constraint 6]

### Sensitive Data Privacy

**Weight, mobility, and pain never enter logs, analytics, or URL query strings.** The AuditEvent.metadata field never includes athlete weight, mobility detail, or pain detail. URLs never carry these values. Tests assert this. [PRD 12.2, 12.5, Constraint 7]

### Server Components by Default

**Pages and layouts are server components.** "use client" is added only to leaf components that genuinely need interactivity (forms, state, event handlers). This keeps the render tree mostly server-side, reducing client JavaScript and enabling better data access patterns.

### Canonical Units

**Seconds, grams, metres everywhere internally.** No business logic parses "1 hour 30 minutes" or "75 kg". Instead, user input is parsed once at the boundary (via parseDuration, etc.), and the entire business layer works with canonical units. Display formatting happens only at the UI boundary.

---

## Development Roadmap

### Phase 0: Foundation ✅ COMPLETE

**Goal:** CI-ready codebase with canonical unit system and seeded reference data.

- ✅ Project scaffold (Next.js 15, TypeScript strict, Vitest)
- ✅ PostgreSQL database + Prisma schema
- ✅ Full schema (14 models, all PRD entities)
- ✅ Unit system (seconds, grams, metres)
- ✅ Seeded stations (8), divisions (5), standards, ruleset

**Note:** Station loads and ruleset values are unapproved placeholders. Constraint 4 (guardrail gate) prevents them from silently reaching production.

### Phase 1: Predictor (Public, No Auth) 🔄 IN PROGRESS

**Goal:** Stranger can enter 7 fields and get credible finish-time range.

- T-06: Input schema + validation (per-field errors)
- T-07: Rules-based estimator (range, confidence, drivers, warnings)
- T-08: Form + result page (public route, no account required)
- T-09: Abuse controls (rate limiting by IP/session)
- T-10: Live recalculation (new Prediction on input change)

### Phase 2: Accounts & Onboarding 🔄 IN PROGRESS

**Goal:** Athletes sign up, complete 6-step onboarding, claim their prediction.

- T-11: Auth (signup, signin, logout, password recovery, deletion)
- T-12: Consent capture (terms, privacy, safety disclaimer, sensitive data)
- T-13: Claim anonymous prediction on signup
- T-14: Onboarding flow (6 steps: stations, background, work, mobility, equipment, availability)
- T-15: Safety screening + red-flag gate

### Phase 3: Plan Engine 🔄 PLANNED

**Goal:** Admin-approved templates and guardrails; plan generation gated by approval.

- T-16: Template CRUD + approval workflow (DRAFT → PENDING_APPROVAL → APPROVED)
- T-17: Phase calculation (FOUNDATION, DEVELOPMENT, RACE_SPECIFIC, PEAK, TAPER, RACE_WEEK)
- T-18: Session allocation (respect daily availability, surface misalignment warning)
- T-19: Session balancing (running, strength, station skill, combined, mobility, recovery)
- T-20: Guardrail layer (progression caps, recovery, taper, no post-race, equipment, no stacking)
- T-21: Rationale & traceability (template version, ruleset version persisted)
- T-22: Idempotence (same inputs + versions = same plan)

**Gate:** Do not ship Phase 3 until ruleset and standard set have recorded professional approval.

### Phase 4: Athlete Experience 🔄 PLANNED

**Goal:** Dashboard, workout detail, session check-in, burn-down view.

- T-23: Calendar view (weekly, monthly, phase-aware)
- T-24: Workout detail (title, purpose, duration, equipment, warm-up/main/cooldown, intensity, substitutions, safety notes)
- T-25: Post-session check-in (completion, RPE, actual duration, pain/mobility flag, substitutions, notes)
- T-26: Burn-down dashboard (days remaining, current phase, adherence, risk flags)

### Phase 5: Adaptation 🔄 PLANNED

**Goal:** Plans evolve with athlete; missed sessions never increase future load.

- T-27: Immutability enforcement (locked sessions reject writes at data layer)
- T-28: Recalculation triggers (benchmark, schedule, missed, interruption, equipment, user-moved session)
- T-29: Material change acceptance (pending vs. auto-applied)
- T-30: Safety pause (pain report pauses plan, requires explicit resume)

### Phase 6: Launch Readiness 🔄 PLANNED

**Goal:** Production-ready observability, compliance, accessibility.

- T-31: Data export & deletion (machine-readable export, correction, withdrawal workflows)
- T-32: Accessibility (WCAG 2.2 AA, keyboard-only walkthrough)
- T-33: Observability (logging model version & latency; no sensitive values in logs)
- T-34: Analytics (consent-gated; never tracks exact weight, health detail, pain)

---

## Testing Strategy

### Test Organization

- **Unit Tests:** Pure functions (estimator, phase calculation, guardrails) in `*.test.ts`
- **Integration Tests:** Database mutations, server actions, full flow (planned)
- **Property Tests:** Edge cases (degenerate horizons, overlapping phases, missing constraints)
- **Accessibility Tests:** Keyboard navigation, screen-reader labels, contrast, colour-only (planned)

### Coverage Requirements

- Every validation path in Zod schemas
- Every guardrail rule (progression, recovery, taper, no stacking, etc.)
- Red-flag screening logic
- Immutability enforcement (assert locked sessions reject writes)
- Sensitive data privacy (assert weight/pain/mobility never logged)

### CI/CD Gating

- `npm run typecheck` must pass (TypeScript strict)
- `npm test` must pass (all unit tests)
- `npm run lint` must pass (ESLint)
- No commit without passing CI

---

## Deployment & Operations

### Development Setup

```bash
# Install dependencies
npm install

# Set up database (Docker)
docker-compose up -d

# Run migrations and seeding
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev
```

### Build & Deployment

- **Build:** `npm run build` (Next.js static export + server functions)
- **Start:** `npm start` (production server)
- **Database:** PostgreSQL with Prisma migrations
- **Hosting:** (TBD — Vercel, AWS, self-hosted)

### Monitoring & Logging

- Audit trail via AuditEvent model (all significant actions logged)
- Error tracking (integration TBD)
- Performance monitoring (latency, plan-generation time)
- Safety metrics (red-flag frequency, recalculation triggers)

---

## Open Questions & Blockers

| # | Question | Blocks | Status |
|---|----------|--------|--------|
| 5 | Are under-18 athletes excluded? | T-06 (input validation) | Open |
| 9 | Which inputs may the model use after fairness/privacy review? | T-07 (estimator design) | Open |
| 10 | Fallback when confidence is too low? | T-07, T-08 | Open |
| 11 | Who is the accountable professional approving content and guardrails? | T-16, Phase 3 gate | **Blocker** |
| 12 | What triggers a hard stop vs. substitution vs. clearance message? | T-15 (red-flag screening) | **Blocker** |
| 13 | Supported planning horizon when race day is very close or distant? | T-06, T-17 | Open |
| 15 | Which equipment substitutions are safe and race-specific enough? | T-16 (template design) | Open |

**Where a task is blocked, the code is built with clearly-marked placeholders in configuration, never hardcoded with invented values that read as authoritative.**

---

## Summary

**HYROX Coach AI** is a full-stack Next.js application built around a core principle: _transparent, data-driven personalization for athlete training_.

The architecture emphasizes:

- **Safety:** Red flags pause work; constraints are enforced at every layer
- **Immutability:** History is never overwritten; adaptation generates new versions
- **Simplicity:** Canonical units, pure functions, server components by default
- **Traceability:** Every decision is audited and rationale is attached
- **Privacy:** Sensitive health data is protected at the database and logging layer

The codebase is organized into clear layers (presentation, API, business logic, data access, infrastructure) with strong separation of concerns. Testing is comprehensive; CI gating ensures code quality. The development roadmap is phased to allow parallel work on the predictor (public, no auth) while the team works through onboarding, plan generation, and adaptation subsystems.

**Phase 0 is complete.** Phase 1 (predictor) is in progress. Phases 2–6 will follow, each building on the previous and carefully respecting the hard constraints that make this a safe, trustworthy platform for athlete training guidance.

---

**References:**
- `BUILD_ORDER.md` — Detailed task breakdown and acceptance criteria
- `CLAUDE.md` — Claude Code guidelines and project conventions
- `HYROX_Personalized_Training_PRD.md` — Complete product requirements
- `prisma/schema.prisma` — Full database schema
