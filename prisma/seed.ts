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

  const ruleset = await prisma.ruleSet.upsert({
    where: { name: 'HYROX_GUARDRAIL_APPROVED' },
    update: {},
    create: {
      name: 'HYROX_GUARDRAIL_APPROVED',
      version: '1.0.0',
      config: JSON.stringify(rulesetConfig),
      approvedBy: 'system@hyroxcoach.ai', // Approved for development
      approvedAt: new Date(),
    },
  });

  // Seed approved workout templates for Phase 3
  const templates = [
    {
      name: 'Foundation: General Strength',
      description: 'Build foundational strength across all movement patterns',
      difficulty: 'BEGINNER',
      phase: 'FOUNDATION',
      equipment: ['dumbbells', 'squat_rack'],
      exercises: [
        { name: 'Goblet Squats', reps: 15, sets: 3, duration: 600 },
        { name: 'Push-ups', reps: 10, sets: 3, duration: 600 },
        { name: 'Deadlifts', reps: 8, sets: 3, duration: 600 },
      ],
      estimatedDurationSeconds: 1800,
    },
    {
      name: 'Foundation: Aerobic Base',
      description: 'Develop aerobic capacity and endurance',
      difficulty: 'BEGINNER',
      phase: 'FOUNDATION',
      equipment: ['running'],
      exercises: [
        { name: 'Easy Run', distance: 5, duration: 1800 },
      ],
      estimatedDurationSeconds: 1800,
    },
    {
      name: 'Development: Interval Work',
      description: 'Improve VO2 max and lactate threshold',
      difficulty: 'INTERMEDIATE',
      phase: 'DEVELOPMENT',
      equipment: ['running', 'track'],
      exercises: [
        { name: 'Warm-up', duration: 300 },
        { name: '400m intervals', reps: 8, duration: 1500 },
        { name: 'Cool-down', duration: 300 },
      ],
      estimatedDurationSeconds: 2400,
    },
    {
      name: 'Race Specific: Station Skills',
      description: 'Practice HYROX-specific obstacle techniques',
      difficulty: 'INTERMEDIATE',
      phase: 'RACE_SPECIFIC',
      equipment: ['obstacles', 'wall_ball'],
      exercises: [
        { name: 'Wall Ball Practice', reps: 20, sets: 3, duration: 900 },
        { name: 'Sled Push Practice', distance: 50, sets: 3, duration: 900 },
      ],
      estimatedDurationSeconds: 2400,
    },
    {
      name: 'Peak: Max Effort',
      description: 'Build peak power and intensity',
      difficulty: 'ADVANCED',
      phase: 'PEAK',
      equipment: ['dumbbells', 'barbell'],
      exercises: [
        { name: 'Heavy Squats', reps: 5, sets: 4, duration: 1200 },
        { name: 'Heavy Deadlifts', reps: 3, sets: 5, duration: 1200 },
      ],
      estimatedDurationSeconds: 2400,
    },
  ];

  for (const template of templates) {
    // Check if template already exists
    const existing = await prisma.workoutTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      await prisma.workoutTemplate.create({
        data: {
          name: template.name,
          version: '1.0.0',
          description: template.description,
          primaryFocus: 'COMBINED',
          purposeStatement: template.description,
          duration: template.estimatedDurationSeconds,
          phase: template.phase,
          equipment: JSON.stringify(template.equipment),
          intensityLevel: 'MODERATE',
          status: 'APPROVED',
          approvedBy: 'system@hyroxcoach.ai',
          approvedAt: new Date(),
        },
      });
    }
  }

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
