# HYROX Coach AI — Project Review

**Status:** Phase 0 ✅ (Foundation) + Phase 1 ✅ (Predictor, Tasks 6-8)  
**Tests:** 85 passing • **Typecheck:** Clean • **Commits:** 6

---

## 📋 Architecture Overview

### Tech Stack
- **Framework:** Next.js 15 App Router
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Prisma 6 ORM
- **Validation:** Zod (shared client/server)
- **Testing:** Vitest
- **State Management:** React hooks (client-side only so far)

### Core Principles Applied
✅ **Units:** All internal calculations use seconds, grams, metres  
✅ **No new dependencies** without discussion  
✅ **Server components by default** + "use client" only for interactivity  
✅ **Immutability:** Completed sessions will be locked (prepared for T-25)  
✅ **Safety:** Clear disclaimers, no medical claims, no rankings  
✅ **Privacy:** Sensitive data never in logs/URLs (prepared for T-33, T-34)

---

## 📁 Project Structure

```
HyroxTrainingApp/
├── app/
│   ├── layout.tsx              # Root layout with global styles
│   ├── page.tsx                # Homepage with hero + features
│   ├── globals.css             # Base styles
│   ├── predict/
│   │   └── page.tsx            # Public predictor page [T-08]
│   └── signup/
│       └── page.tsx            # Account creation (placeholder)
│
├── src/
│   ├── lib/
│   │   ├── units.ts            # Canonical unit system [T-04]
│   │   ├── units.test.ts       # 24 tests
│   │   ├── domain/
│   │   │   └── stations.ts     # HYROX station definitions [T-05]
│   │   ├── predictor/
│   │   │   ├── schema.ts       # Input validation (Zod) [T-06]
│   │   │   ├── schema.test.ts  # 33 tests
│   │   │   ├── estimator.ts    # Finish-time logic [T-07]
│   │   │   └── estimator.test.ts # 28 tests
│   │   └── actions/
│   │       └── predict.ts      # Server action for predictions [T-08]
│   └── components/
│       └── predictor/
│           ├── PredictorForm.tsx    # Form UI [T-08]
│           └── PredictorResult.tsx  # Results display [T-08]
│
├── prisma/
│   ├── schema.prisma           # Full DB schema [T-03]
│   ├── seed.ts                 # Database seeding [T-05]
│   └── migrations/             # Migration directory [T-02]
│
├── docker-compose.yml          # PostgreSQL [T-02]
├── scripts/setup.sh            # Setup automation [T-02]
├── package.json                # Dependencies [T-01]
├── tsconfig.json               # TypeScript strict [T-01]
├── next.config.mjs             # Next.js config [T-01]
├── vitest.config.ts            # Test config
├── BUILD_ORDER.md              # Development roadmap
├── CLAUDE.md                   # Claude Code guidelines
├── README.md                   # Project docs
└── REVIEW.md                   # This file
```

---

## 🔧 What's Been Built

### Phase 0: Foundation ✅

#### T-01: Project Scaffold
- Next.js 15 App Router + TypeScript strict mode
- Prisma client and schema structure
- Vitest test framework
- All project files and configuration

#### T-02: Database & Tooling
- PostgreSQL via Docker Compose
- Prisma migrations directory
- Setup script for automated initialization
- `.env.local` configuration

#### T-03: Full Database Schema
**Models created:**
- `Athlete` — User accounts with role and profile
- `Prediction` — Public + authenticated predictions
- `Consent` — Privacy/terms/safety consent tracking
- `Onboarding` — 6-step onboarding profile
- `Station` — HYROX obstacle definitions (8 stations)
- `Division` — Race divisions (5 types)
- `EventStandardSet` — Race benchmarks (unapproved placeholder)
- `RuleSet` — Guardrail rules (unapproved placeholder)
- `WorkoutTemplate` — Reusable workout definitions
- `TemplateSubstitution` — Safe workout swaps
- `TrainingPlan` — Athlete's plan with phases
- `TrainingSession` — Individual workouts (locked after completion)
- `SessionCheckIn` — Workout completion + feedback
- `PlanAdjustment` — Immutable plan change history
- `AuditEvent` — Governance logging

All models include constraint references (e.g., `[FR-A02]`, `[T-25]`).

#### T-04: Canonical Unit System
**`src/lib/units.ts`** — 24 tests passing
- Parse durations: `"1:30"`, `"1h30m"`, `"90"` → seconds
- Format durations: seconds → `"1:30:45"` or `"1h 30m 45s"`
- Convert weights: kg ↔ lb ↔ grams
- Validate weight bounds: 30–200 kg
- Validate planning horizon: 1–365 days

No other module parses durations—this is the single source of truth.

#### T-05: Seeded Data
**`src/lib/domain/stations.ts`**
- 8 HYROX stations (SkiErg, Rowing, Wall Balls, Tire Flip, Rope Climb, Rig, Sanctum, Fire Jump)
- Station loads marked as `null` (unapproved placeholders)

**`prisma/seed.ts`**
- Upserts stations, divisions, event standards, rulesets
- All approval fields are `null` (blocks plan generation per Constraint 4)
- Ready for professional sign-off [T-16]

---

### Phase 1: Public Predictor ✅

#### T-06: Input Validation Schema
**`src/lib/predictor/schema.ts`** — 33 tests passing

**Zod schema validates:**
```
Age:                16–120 years
Category:           INDIVIDUAL | TEAM
Division:           5 valid HYROX divisions
5K Time:            900–3600 seconds (15–60 minutes)
5K Recency:         RECENT | 3_MONTHS | 6_MONTHS | STALE | NO_DATA
Weight:             30–200 kg (auto-converts from lb)
Competition Date:   1–365 days in future
Target Time:        (optional) 900–14400 seconds (15 min – 4 hours)
Prior Result:       COMPLETED | DNF | NO_PRIOR_RESULT

Returns:            { valid: bool, data?: PredictorInput, errors: Record<string, string> }
```

**Field-level error messages [US-01 criterion 2]:**
- Per-field validation (no thrown exceptions)
- Human-readable explanations
- Both client + server validate from same schema

#### T-07: Finish-Time Estimator
**`src/lib/predictor/estimator.ts`** — 28 tests passing

**Pure function. No database access, no I/O.**

**Returns:**
```typescript
{
  lowSeconds: number;        // Conservative estimate (range, not point)
  highSeconds: number;       // Optimistic estimate
  confidence: number;        // 0.0–1.0 [FR-P04]
  drivers: Driver[];         // Key factors with weights [FR-P05]
  dataQualityWarnings: [];   // Stale data, first-time, low confidence
  goalGapLabel: string;      // WITHIN_RANGE | STRETCH | REQUIRES_MORE_EVIDENCE [FR-P08]
  modelVersion: string;      // "0.1.0-alpha" (reproducibility [T-21])
}
```

**Confidence calculation [FR-P04]:**
- Base: 5K recency multiplier (1.0 if recent, 0.3 if no data)
- Boost: +0.15 if prior HYROX completed
- Penalty: -0.25 if prior DNF
- Clamped: 0.0–1.0

**Drivers [FR-P05]:**
1. 5K running fitness (weight: 0.4)
2. Prior HYROX (if available)
3. Age adjustment (if 25–35)
4. 5K recency (if not recent)
5. Division

**Data Quality Warnings:**
- `STALE_5K_DATA` (severity: CONCERN)
- `NO_PRIOR_HYROX` (severity: INFO)
- `LOW_CONFIDENCE` (severity: CAUTION)

**Goal Gap Assessment [FR-P08]:**
- `WITHIN_RANGE` if target is in predicted range
- `STRETCH` if target < low range + confidence ≥ 0.6 (ambitious but plausible)
- `REQUIRES_MORE_EVIDENCE` otherwise

**Placeholder coefficients** clearly marked:
```
baseTimeSeconds: 2700         // ~45 min baseline
fiveKmWeight: 0.4            // Running ability importance
divisionAdjustments: {...}   // Pro vs. Open adjustments
recencyMultipliers: {...}    // How stale data affects confidence
ageAdjustmentPerYear: 0.02   // ~2% per year from age 30
```

**No ranking claims [PRD 9.1]:** Drivers use plain language, no percentiles.

#### T-08: Predictor Form & Results Page
**Public, no authentication required.**

**Server Action (`src/lib/actions/predict.ts`):**
```typescript
createPrediction(input) → {
  success: bool,
  prediction?: { id, lowSeconds, highSeconds, ... },
  errors?: { [fieldName]: errorMessage }
}
```
- Validates input [T-06]
- Runs estimator [T-07]
- Saves Prediction row with `athleteId: null` (public prediction)
- Returns estimate for immediate display

**Form Component (`src/components/predictor/PredictorForm.tsx`):**
- 7 input fields (age, weight, 5K time/recency, race date, division, target, prior result)
- Real-time error feedback as user types
- Unit conversion at boundary (kg ↔ lb)
- Time input (MM:SS format)
- Clean, accessible design
- Loading state during submission

**Results Component (`src/components/predictor/PredictorResult.tsx`):**
- **Headline:** "Your HYROX Finish-Time Estimate"
- **Main Box:** Range display (e.g., "47:30–54:45") + confidence meter
- **Confidence:** Visual bar + label (High/Good/Moderate/Low) + explanation
- **Key Drivers:** List with weight visualization
- **Goal Gap:** (if target provided) Status + explanation
- **Data Quality Warnings:** Color-coded cards (INFO/CAUTION/CONCERN)
- **Disclaimer [US-01 criterion 2]:**
  - ✅ **Always visible** (not collapsed)
  - ✅ Explains this is guidance, not guarantee
  - ✅ No medical diagnosis claims
  - ✅ Encourages health professional consultation
  - ✅ Mentions event demands (8km + 8 obstacles)
- **CTA Section:** "Ready to Train?" + Link to signup + "Try Another Estimate" button

**Routes:**
- `GET /` — Homepage with hero CTA
- `GET /predict` — Public predictor form
- `POST [action]` — createPrediction server action
- `GET /signup` — Account creation (placeholder)

---

## ✅ Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| `src/lib/units.ts` | 24 | ✅ All pass |
| `src/lib/predictor/schema.ts` | 33 | ✅ All pass |
| `src/lib/predictor/estimator.ts` | 28 | ✅ All pass |
| **Total** | **85** | ✅ All pass |

**Test Categories:**
- ✅ Happy path (complete, valid input)
- ✅ Sparse input (lower confidence, wider range)
- ✅ Edge cases (min/max ages, dates, times)
- ✅ Error paths (invalid input, rejection messages)
- ✅ Range validation (low < high, never point estimate)
- ✅ Confidence derivation (recent vs. stale vs. no data)
- ✅ Driver list and weights
- ✅ Goal gap assessment
- ✅ No database access (pure functions)
- ✅ No ranking/percentile claims

**Typecheck:** ✅ Clean (no TS errors)

---

## 📊 Database Schema Highlights

### Prediction Model (Public Predictions)
```prisma
model Prediction {
  // Inputs
  age: Int
  category: String        // "INDIVIDUAL" | "TEAM"
  weightGrams: Int
  fiveKmTimeSeconds: Int
  fiveKmRecency: String   // Recency band
  competitionDate: DateTime
  division: String
  targetFinishTime: Int?
  priorHyroxResult: String?

  // Results [T-07]
  lowSeconds: Int
  highSeconds: Int
  confidence: Float
  drivers: String         // JSON array
  dataQualityWarnings: String?  // JSON array
  goalGapLabel: String    // "WITHIN_RANGE" | "STRETCH" | "REQUIRES_MORE_EVIDENCE"
  modelVersion: String    // For reproducibility [T-21]
}
```

### TrainingSession Model (Prepared for Immutability)
```prisma
model TrainingSession {
  locked: Boolean @default(false)  // [Constraint 1, FR-A02]
  // Once checkIn is created, this gets locked at data layer
}
```

### Guardrail Support (Ready for T-20)
```prisma
model RuleSet {
  config: String  // JSON with all thresholds
  approvedBy: String?
  approvedAt: DateTime?
  // Constraint 4: Cannot run generation without approval
}
```

---

## 🔒 Security & Privacy Implemented

✅ **Sensitive data protection [Constraint 7]:**
- Weight, mobility, pain details never saved in logs
- No query string parameters with sensitive values
- Audit events don't copy sensitive metadata

✅ **Safety gates ready [Constraint 4]:**
- RuleSet/EventStandardSet approval fields
- Plan generation will refuse unapproved configs

✅ **Immutability prepared [Constraint 1]:**
- TrainingSession.locked field
- Data layer will enforce at T-27

✅ **No medical claims [PRD principles]:**
- Disclaimer language in predictor results
- No "readiness", "clearance", or "guarantee" language
- Links to health professionals

✅ **No ranking language [PRD 9.1 governance]:**
- Drivers use plain language
- No percentiles, rankings, or "top X" claims

---

## 🎯 What Works Now

✅ **Full predictor workflow:**
1. User lands on `/predict`
2. Fills 7 inputs with real-time validation
3. Submits → server validates, estimates, saves prediction
4. Sees result: range, confidence, drivers, warnings, disclaimer, CTA

✅ **Database schema is complete** and ready for onboarding/planning

✅ **Unit system** is tested and ready for all future calculations

✅ **Estimator logic** can be easily tuned (coefficients are in one place)

✅ **All constraints** are documented in code (e.g., `[FR-A02]`, `[T-25]`)

---

## 🚧 What's Next

### Phase 1 Remaining (T-09, T-10)
- **T-09:** Rate limiting the public predictor (by IP + session)
- **T-10:** Real-time recalculation on input change (without page reload)

### Phase 2: Accounts & Onboarding (T-11 through T-15)
- **T-11:** Authentication (sign up, sign in, password recovery)
- **T-12:** Consent capture (terms, privacy, sensitive data)
- **T-13:** Claim anonymous prediction on signup
- **T-14:** Onboarding flow (6 steps, resumable)
- **T-15:** Safety screening + red-flag gate

### Phase 3: Plan Engine (T-16 through T-22)
- Admin templates & approval system
- Phase calculation (FOUNDATION → RACE_WEEK)
- Session allocation & balancing
- Guardrail enforcement
- Traceability & versioning

---

## 📝 Key Decisions Made

1. **Placeholder coefficients:** Explicitly marked as unapproved; easy to replace once product team decides on actual model
2. **No auth for predictor:** Public, stateless, unauthenticated [US-01 requirement]
3. **Server action for predictions:** Keeps validation logic DRY; same schema runs client + server
4. **Immutability pattern:** TrainingSession.locked prevents accidental edits post-completion [Constraint 1]
5. **Approval gates:** RuleSet/EventStandardSet have `approvedBy` + `approvedAt` fields; generation will refuse null values [Constraint 4]

---

## 📖 How to Use the Code

### Adding a New Predictor Input
1. Add field to `PredictorInputSchema` (Zod schema)
2. Add field to `PredictorInput` type
3. Add test cases in `schema.test.ts`
4. Update `estimateFinishTime()` to use it
5. Add form field in `PredictorForm.tsx`

### Tuning the Estimator
Edit `PLACEHOLDER_COEFFICIENTS` in `estimator.ts`:
```typescript
const PLACEHOLDER_COEFFICIENTS = {
  baseTimeSeconds: 2700,      // Change baseline
  fiveKmWeight: 0.4,          // Adjust running fitness importance
  divisionAdjustments: {...}, // Pro vs. Open adjustments
  // etc.
}
```

### Running Tests
```bash
npm test                    # Run all tests in watch mode
npm test -- --run          # Run once and exit
npm run typecheck          # Check TypeScript
```

### Starting the Dev Server
```bash
npm run dev                # Starts on http://localhost:3000
npm run db:studio          # Opens Prisma Studio for DB inspection
```

---

## ✨ Summary

**We have built a working public HYROX Time Predictor with:**
- Full validation pipeline (input → estimation → persistence)
- 85 passing tests
- Zero authentication requirements
- Clear safety disclaimers
- Prepared infrastructure for future phases

**The foundation is solid for:**
- T-09/T-10 (rate limiting, live updates)
- Phase 2 (auth, onboarding)
- Phase 3 (plan engine, guardrails)

All code is documented with requirement IDs, commits are small and focused, and the codebase follows the BUILD_ORDER constraints.
