# HYROX Coach AI

A responsive web platform that helps athletes prepare for HYROX competitions through personalized, day-by-day training plans.

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16+ (via Docker)

### Setup

```bash
npm run setup
```

This will:
1. Install dependencies
2. Start PostgreSQL
3. Run database migrations
4. Seed initial data

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Database UI
npm run db:studio
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
.
├── app/              # Next.js App Router
├── src/
│   └── lib/          # Shared utilities
│       ├── units.ts  # Canonical unit system
│       └── domain/   # Domain logic
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Database seeding
└── BUILD_ORDER.md    # Development tasks
```

## Technology Stack

- **Framework:** Next.js 15 + React 19
- **Database:** PostgreSQL + Prisma ORM
- **Language:** TypeScript (strict mode)
- **Validation:** Zod
- **Testing:** Vitest
- **Auth:** Session-based with bcryptjs

## Key Principles

1. **Safety before intensity** - Clear safety gates and professional review
2. **Explain recommendations** - Transparent assumptions and uncertainty ranges
3. **Fit real schedules** - Personalized to athlete's actual availability
4. **Privacy first** - Minimal sensitive data collection
5. **Accessibility** - WCAG 2.2 AA compliant

## Units

All internal calculations use:
- **Duration:** seconds
- **Weight:** grams  
- **Distance:** metres

Convert only at the UI boundary using `src/lib/units.ts`.

## Build Order

See `BUILD_ORDER.md` for the development roadmap. Phases:

1. ✅ Phase 0: Foundation (this stage)
2. Phase 1: Predictor (public, no auth)
3. Phase 2: Accounts & Onboarding
4. Phase 3: Plan Engine
5. Phase 4: Athlete Experience
6. Phase 5: Adaptation
7. Phase 6: Launch Readiness

## Database Setup

Start PostgreSQL:
```bash
docker-compose up -d
```

Stop PostgreSQL:
```bash
docker-compose down
```

Clean database:
```bash
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

## Environment Variables

Copy `.env.example` to `.env.local`:
```bash
DATABASE_URL="postgresql://hyrox_user:hyrox_password@localhost:5432/hyrox_db"
```

## References

- [HYROX Website](https://www.hyrox.com)
- [BUILD_ORDER.md](./BUILD_ORDER.md) - Development roadmap
- [PRD](./HYROX_Personalized_Training_PRD.md) - Product requirements
