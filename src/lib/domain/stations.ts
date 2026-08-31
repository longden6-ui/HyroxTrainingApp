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
    id: 'sled-push',
    name: 'SkiErg',
    displayName: 'SkiErg',
    description: 'Ski rowing machine ergometer',
    order: 1,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'sled-pull',
    name: 'Rowing Machine',
    displayName: 'Rowing Machine',
    description: 'Rowing ergometer',
    order: 2,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'wall-balls',
    name: 'Wall Balls',
    displayName: 'Wall Balls',
    description: 'Medicine ball throws to target',
    order: 3,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'tire-flip',
    name: 'Tire Flip',
    displayName: 'Tire Flip',
    description: 'Flipping a heavy tire',
    order: 4,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'rope-climb',
    name: 'Rope Climb',
    displayName: 'Rope Climb',
    description: 'Rope climbing station',
    order: 5,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'rig',
    name: 'Rig',
    displayName: 'Rig',
    description: 'Pull-up rig and overhead movements',
    order: 6,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'sanctum',
    name: 'Sanctum',
    displayName: 'Sanctum',
    description: 'Low-crawl underground obstacle',
    order: 7,
    easyLoadGrams: null,
    moderateLoadGrams: null,
    hardLoadGrams: null,
  },
  {
    id: 'fire-jump',
    name: 'Fire Jump',
    displayName: 'Fire Jump',
    description: 'High box jump over obstacle',
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
