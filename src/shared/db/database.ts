import type { Table } from 'dexie';
import type { Entry, Profile, WeightRecord } from './types';
import Dexie from 'dexie';

export type AppDatabase = Dexie & {
  entries: Table<Entry, string>;
  profile: Table<Profile, string>;
  weightLog: Table<WeightRecord, number>;
};

export const db = new Dexie('calories-count') as AppDatabase;

db.version(1).stores({
  entries: 'id, date, foodId',
  profile: 'id',
  weightLog: '++id, &date',
});

export const PROFILE_ID = 'me';
