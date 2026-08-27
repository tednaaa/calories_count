import type { Basis, CustomFood, Entry, Profile, WeightRecord } from './types';
import { toDateKey } from '@/shared/lib';
import { db, PROFILE_ID } from './database';

export const BACKUP_VERSION = 1;

export interface Backup {
  version: number;
  exportedAt: string;
  profile: Profile | null;
  entries: Entry[];
  customFoods: CustomFood[];
  weightLog: WeightRecord[];
}

export type BackupMode = 'replace' | 'merge';

export type BackupCheck
  = | { ok: true; backup: Backup }
    | { ok: false; reason: string };

function isBasis(value: unknown): value is Basis | undefined {
  const basis = value as Basis | null;

  return basis === undefined || (typeof basis?.grams === 'number' && typeof basis.kcal === 'number');
}

function isEntry(value: unknown): value is Entry {
  const entry = value as Entry | null;

  return typeof entry?.id === 'string'
    && typeof entry.date === 'string'
    && typeof entry.createdAt === 'number'
    && (entry.foodId === undefined || typeof entry.foodId === 'string')
    && (entry.photo === undefined || typeof entry.photo === 'string')
    && typeof entry.qty === 'number'
    && typeof entry.kcalPerPortion === 'number'
    && (entry.grams === undefined || typeof entry.grams === 'number')
    && isBasis(entry.basis)
    && typeof entry.name === 'string';
}

function isCustomFood(value: unknown): value is CustomFood {
  const food = value as CustomFood | null;

  return typeof food?.id === 'string'
    && typeof food.name === 'string'
    && typeof food.kcal === 'number'
    && (food.grams === undefined || typeof food.grams === 'number')
    && isBasis(food.basis)
    && (food.photo === undefined || typeof food.photo === 'string')
    && typeof food.createdAt === 'number'
    && typeof food.updatedAt === 'number';
}

function isWeightRecord(value: unknown): value is WeightRecord {
  const record = value as WeightRecord | null;

  return typeof record?.date === 'string'
    && typeof record.kg === 'number'
    && typeof record.createdAt === 'number';
}

function isProfile(value: unknown): value is Profile {
  const profile = value as Profile | null;

  return profile?.id === PROFILE_ID
    && typeof profile.age === 'number'
    && typeof profile.heightCm === 'number'
    && typeof profile.weightKg === 'number'
    && typeof profile.targetKcal === 'number';
}

export function backupFileName(date: Date = new Date()): string {
  return `calories-count-${toDateKey(date)}.json`;
}

export function describeBackup(backup: Backup): string {
  return [
    `записей: ${backup.entries.length}`,
    `своих блюд: ${backup.customFoods.length}`,
    `профиль: ${backup.profile ? 'есть' : 'нет'}`,
    `замеров веса: ${backup.weightLog.length}`,
  ].join(', ');
}

export function readBackup(raw: string): BackupCheck {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  }
  catch {
    return { ok: false, reason: 'Файл не похож на JSON' };
  }

  const candidate = parsed as Partial<Backup> | null;

  if (candidate?.version !== BACKUP_VERSION) {
    return { ok: false, reason: 'Незнакомый формат копии' };
  }
  if (!Array.isArray(candidate.entries) || !candidate.entries.every(isEntry)) {
    return { ok: false, reason: 'Записи дневника в файле повреждены' };
  }

  const customFoods = candidate.customFoods ?? [];

  if (!Array.isArray(customFoods) || !customFoods.every(isCustomFood)) {
    return { ok: false, reason: 'Свои блюда в файле повреждены' };
  }
  if (!Array.isArray(candidate.weightLog) || !candidate.weightLog.every(isWeightRecord)) {
    return { ok: false, reason: 'История веса в файле повреждена' };
  }
  if (candidate.profile != null && !isProfile(candidate.profile)) {
    return { ok: false, reason: 'Профиль в файле повреждён' };
  }

  return {
    ok: true,
    backup: {
      version: BACKUP_VERSION,
      exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
      profile: candidate.profile ?? null,
      entries: candidate.entries,
      customFoods,
      weightLog: candidate.weightLog,
    },
  };
}

export async function collectBackup(): Promise<Backup> {
  const [profile, entries, customFoods, weightLog] = await Promise.all([
    db.profile.get(PROFILE_ID),
    db.entries.toArray(),
    db.customFoods.toArray(),
    db.weightLog.toArray(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    entries,
    customFoods,
    weightLog,
  };
}

export async function applyBackup(backup: Backup, mode: BackupMode): Promise<void> {
  await db.transaction('rw', db.entries, db.customFoods, db.profile, db.weightLog, async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.entries.clear(),
        db.customFoods.clear(),
        db.profile.clear(),
        db.weightLog.clear(),
      ]);
    }

    await db.entries.bulkPut(backup.entries);
    await db.customFoods.bulkPut(backup.customFoods);

    const keepsCurrentProfile = mode === 'merge' && await db.profile.get(PROFILE_ID) !== undefined;

    if (backup.profile && !keepsCurrentProfile) {
      await db.profile.put(backup.profile);
    }

    for (const record of backup.weightLog) {
      const existing = await db.weightLog.where('date').equals(record.date).first();

      await db.weightLog.put({ ...existing, date: record.date, kg: record.kg, createdAt: record.createdAt });
    }
  });
}

export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.entries, db.customFoods, db.profile, db.weightLog, async () => {
    await Promise.all([
      db.entries.clear(),
      db.customFoods.clear(),
      db.profile.clear(),
      db.weightLog.clear(),
    ]);
  });
}
