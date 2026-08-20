import type { Table } from 'dexie';
import type { CustomFood, Entry, Profile, WeightRecord } from './types';
import Dexie from 'dexie';

export type AppDatabase = Dexie & {
  entries: Table<Entry, string>;
  customFoods: Table<CustomFood, string>;
  profile: Table<Profile, string>;
  weightLog: Table<WeightRecord, number>;
};

export const db = new Dexie('calories-count') as AppDatabase;

db.version(1).stores({
  entries: 'id, date, foodId',
  profile: 'id',
  weightLog: '++id, &date',
});

db.version(2).stores({
  customFoods: 'id, createdAt',
});

export const PROFILE_ID = 'me';
