import { PrismaClient } from '@prisma/client';
import { STATIONS } from '../src/lib/domain/stations';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed stations [T-05]
  for (const station of STATIONS) {
    await prisma.station.upsert({
      where: { name: station.name },
      update: {},
      create: {
        name: station.name,
        displayName: station.displayName,
        description: station.description,
        order: station.order,
        easyLoadGrams: station.easyLoadGrams,
        moderateLoadGrams: station.moderateLoadGrams,
        hardLoadGrams: station.hardLoadGrams,
      },
    });
  }

  // Seed divisions [T-05]
  const divisions = [
    {
      name: 'WOMEN_INDIVIDUAL_OPEN',
      displayName: 'Women Individual Open',
      genderCategory: 'FEMALE',
    },
    {
      name: 'MEN_INDIVIDUAL_OPEN',
      displayName: 'Men Individual Open',
      genderCategory: 'MALE',
    },
    {
      name: 'WOMEN_INDIVIDUAL_PRO',
      displayName: 'Women Individual Pro',
      genderCategory: 'FEMALE',
    },
    {
      name: 'MEN_INDIVIDUAL_PRO',
      displayName: 'Men Individual Pro',
      genderCategory: 'MALE',
    },
    {
      name: 'MIXED_TEAM',
      displayName: 'Mixed Team',
      genderCategory: 'ALL',
    },
  ];

  for (const division of divisions) {
    await prisma.division.upsert({
      where: { name: division.name },
      update: {},
      create: {
        name: division.name,
        displayName: division.displayName,
        genderCategory: division.genderCategory,
      },
    });
  }

  // Seed event standard set (unapproved placeholder [T-05])
  const standardSet = await prisma.eventStandardSet.upsert({
    where: { name: 'HYROX_2026_PLACEHOLDER' },
    update: {},
    create: {
      name: 'HYROX_2026_PLACEHOLDER',
      version: '0.1.0',
      eventYear: 2026,
      approvedBy: null, // Unapproved placeholder
      approvedAt: null,
    },
  });

  // Link standards to divisions
  const allDivisions = await prisma.division.findMany();
  for (const div of allDivisions) {
    await prisma.eventStandard.upsert({
      where: {
        setId_divisionId: {
          setId: standardSet.id,
          divisionId: div.id,
        },
      },
      update: {},
      create: {
        setId: standardSet.id,
        divisionId: div.id,
        finishTimeSeconds: 2400, // Placeholder 40 minutes
      },
    });
  }

  // Seed guardrail ruleset (unapproved placeholder [T-05, T-16])
  const rulesetConfig = {
    progressionCapPercent: 10, // Max 10% increase per week
    minRecoveryDays: 1, // At least 1 rest day per week
    taperWeeks: 2, // 2-week taper before race
    maxDailyLoadPercent: 100, // Hard limit on daily load
    mobilityFlags: {
      LIMITED_MOBILITY: { riskLevel: 'CAUTION', skippableExercises: [] },
      ACTIVE_PAIN: { riskLevel: 'STOP', skippableExercises: [] },
    },
    occupationalLoadThresholds: {
      SEDENTARY: { maxSupplementalMinutes: 0 },
      LIGHT: { maxSupplementalMinutes: 15 },
      MODERATE: { maxSupplementalMinutes: 30 },
      HEAVY: { maxSupplementalMinutes: 45 },
    },
  };

  await prisma.ruleSet.upsert({
    where: { name: 'HYROX_GUARDRAIL_PLACEHOLDER' },
    update: {},
    create: {
      name: 'HYROX_GUARDRAIL_PLACEHOLDER',
      version: '0.1.0',
      config: JSON.stringify(rulesetConfig),
      approvedBy: null, // Unapproved placeholder
      approvedAt: null,
    },
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
