// Canonical HYROX station definitions [T-05]
// These are seeded into the database and referenced throughout the app.

export interface StationDef {
  id: string;
  name: string;
  displayName: string;
  description: string;
  order: number; // 1-8 for standard HYROX order

  // Station loads (null = unapproved placeholder [T-05])
  easyLoadGrams: number | null;
  moderateLoadGrams: number | null;
  hardLoadGrams: number | null;
}

export const STATIONS: StationDef[] = [
  {
    id: 'skierg',
    name: 'SkiErg',
    displayName: 'SkiErg (1,000m)',
    description: '1,000m SkiErg',
    order: 1,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'sled_push',
    name: 'Sled Push',
    displayName: 'Sled Push (50m)',
    description: '50m Sled Push',
    order: 2,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'sled_pull',
    name: 'Sled Pull',
    displayName: 'Sled Pull (50m)',
    description: '50m Sled Pull',
    order: 3,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'burpee_jumps',
    name: 'Burpee Broad Jumps',
    displayName: 'Burpee Broad Jumps (80m)',
    description: '80m Burpee Broad Jumps',
    order: 4,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'rowerг',
    name: 'RowErg',
    displayName: 'RowErg (1,000m)',
    description: '1,000m RowErg',
    order: 5,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'farmers_carry',
    name: "Farmer's Carry",
    displayName: "Farmer's Carry (200m)",
    description: "200m Farmer's Carry",
    order: 6,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'sandbag_lunges',
    name: 'Sandbag Lunges',
    displayName: 'Sandbag Lunges (100m)',
    description: '100m Sandbag Lunges',
    order: 7,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'wall_balls',
    name: 'Wall Balls',
    displayName: 'Wall Balls (100 reps)',
    description: '100 Wall Balls',
    order: 8,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
];

export const STATION_NAMES = STATIONS.map((s) => s.name);
export const STATION_IDS = STATIONS.map((s) => s.id);

export function getStation(nameOrId: string): StationDef | undefined {
  return STATIONS.find(
    (s) => s.name === nameOrId || s.id === nameOrId || s.displayName === nameOrId,
  );
}

export function getStationById(id: string): StationDef | undefined {
  return STATIONS.find((s) => s.id === id);
}

export function getStationByName(name: string): StationDef | undefined {
  return STATIONS.find((s) => s.name === name);
}

export function validateStation(nameOrId: string): boolean {
  return getStation(nameOrId) !== undefined;
}
