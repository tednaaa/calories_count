import type { Basis, CustomFood, Entry, Grades, Nutrients, Profile, Unit, WeightRecord } from './types';
import { toDateKey } from '@/shared/lib';
import { db, PROFILE_ID } from './database';
import { renameGrams } from './legacy';

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

function isUnit(value: unknown): value is Unit | undefined {
  return value === undefined || value === 'g' || value === 'ml';
}

function isNutrients(value: unknown): value is Nutrients | undefined {
  const nutrients = value as Record<string, unknown> | null;

  return nutrients === undefined
    || (typeof nutrients === 'object' && nutrients !== null
      && Object.values(nutrients).every(amount => typeof amount === 'number'));
}

function isGrades(value: unknown): value is Grades | undefined {
  const grades = value as Grades | null;

  return grades === undefined
    || (typeof grades === 'object' && grades !== null
      && (grades.nutriScore === undefined || typeof grades.nutriScore === 'string')
      && (grades.nova === undefined || typeof grades.nova === 'number'));
}

function isBasis(value: unknown): value is Basis | undefined {
  const basis = value as Basis | null;

  return basis === undefined
    || (typeof basis?.amount === 'number' && typeof basis.kcal === 'number' && isNutrients(basis.nutrients));
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
    && (entry.amount === undefined || typeof entry.amount === 'number')
    && isUnit(entry.unit)
    && isBasis(entry.basis)
    && isNutrients(entry.nutrients)
    && isGrades(entry.grades)
    && typeof entry.name === 'string';
}

function isCustomFood(value: unknown): value is CustomFood {
  const food = value as CustomFood | null;

  return typeof food?.id === 'string'
    && typeof food.name === 'string'
    && (food.barcode === undefined || typeof food.barcode === 'string')
    && typeof food.kcal === 'number'
    && (food.amount === undefined || typeof food.amount === 'number')
    && isUnit(food.unit)
    && isBasis(food.basis)
    && isNutrients(food.nutrients)
    && isGrades(food.grades)
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

  const entries = Array.isArray(candidate.entries) ? candidate.entries.map(renameGrams) : null;

  if (!entries?.every(isEntry)) {
    return { ok: false, reason: 'Записи дневника в файле повреждены' };
  }

  const stored = candidate.customFoods ?? [];
  const customFoods = Array.isArray(stored) ? stored.map(renameGrams) : null;

  if (!customFoods?.every(isCustomFood)) {
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
      entries,
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
