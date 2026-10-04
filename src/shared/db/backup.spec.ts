import type { Backup } from './backup';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { BACKUP_VERSION, backupFileName, describeBackup, readBackup } from './backup';

function backup(overrides: Partial<Backup> = {}): Backup {
  return {
    version: BACKUP_VERSION,
    exportedAt: '2026-08-19T12:00:00.000Z',
    profile: null,
    entries: [],
    customFoods: [],
    weightLog: [],
    ...overrides,
  };
}

const entry = {
  id: 'entry-1',
  date: '2026-08-19',
  createdAt: 1_755_600_000_000,
  foodId: 'coffee-black',
  qty: 1,
  kcalPerPortion: 5,
  name: 'Кофе чёрный',
};

const customFood = {
  id: 'b8c1',
  name: 'Пирог у бабушки',
  kcal: 350,
  createdAt: 1_755_600_000_000,
  updatedAt: 1_755_600_000_000,
};

const profile = {
  id: 'me',
  sex: 'male',
  birthDate: yearsBefore(toDateKey(), 30),
  heightCm: 180,
  weightKg: 85,
  activity: 'moderate',
  goal: 'cutMild',
  targetKcal: 2410,
  targetOverridden: false,
  createdAt: 1_755_600_000_000,
  updatedAt: 1_755_600_000_000,
};

describe('backupFileName', () => {
  it('names the file by export date', () => {
    expect(backupFileName(new Date(2026, 7, 19))).toBe('calories-count-2026-08-19.json');
  });
});

describe('describeBackup', () => {
  it('lists what the backup contains', () => {
    const described = describeBackup(backup({ entries: [entry], profile: profile as never }));

    expect(described).toBe('записей: 1, своих блюд: 0, профиль: есть, замеров веса: 0');
  });

  it('counts custom foods', () => {
    expect(describeBackup(backup({ customFoods: [customFood] }))).toContain('своих блюд: 1');
  });

  it('says when there is no profile', () => {
    expect(describeBackup(backup())).toContain('профиль: нет');
  });
});

describe('readBackup', () => {
  it('accepts its own export', () => {
    const result = readBackup(JSON.stringify(backup({ entries: [entry], profile: profile as never })));

    expect(result).toMatchObject({ ok: true });
  });

  it('rejects non-JSON', () => {
    expect(readBackup('привет')).toEqual({ ok: false, reason: 'Файл не похож на JSON' });
  });

  it('rejects a foreign format', () => {
    expect(readBackup(JSON.stringify({ entries: [] }))).toMatchObject({ ok: false });
    expect(readBackup(JSON.stringify(backup({ version: 99 })))).toMatchObject({ ok: false });
  });

  it('rejects broken diary entries', () => {
    const broken = JSON.stringify(backup({ entries: [{ ...entry, qty: 'два' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Записи дневника в файле повреждены' });
  });

  it('accepts amount and label basis in entries and custom foods', () => {
    const weighed = backup({
      entries: [{ ...entry, amount: 130, basis: { amount: 100, kcal: 270 } }],
      customFoods: [{ ...customFood, amount: 30, basis: { amount: 30, kcal: 150 } }],
    });

    expect(readBackup(JSON.stringify(weighed))).toMatchObject({ ok: true });
  });

  it('accepts millilitres', () => {
    const drink = backup({ entries: [{ ...entry, amount: 450, unit: 'ml' }] });

    expect(readBackup(JSON.stringify(drink))).toMatchObject({ ok: true });
  });

  it('rejects an unknown unit', () => {
    const broken = JSON.stringify(backup({ entries: [{ ...entry, unit: 'штук' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Записи дневника в файле повреждены' });
  });

  it('reads a backup from when amount was called grams', () => {
    const older = backup({
      entries: [{ ...entry, grams: 130, basis: { grams: 100, kcal: 270 } }],
      customFoods: [{ ...customFood, grams: 30 }],
    } as never);
    const result = readBackup(JSON.stringify(older));

    expect(result.ok && result.backup.entries[0]).toMatchObject({ amount: 130, basis: { amount: 100, kcal: 270 } });
    expect(result.ok && result.backup.customFoods[0]).toMatchObject({ amount: 30 });
  });

  it('rejects a broken label basis', () => {
    const broken = JSON.stringify(backup({ entries: [{ ...entry, basis: { amount: 100 } }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Записи дневника в файле повреждены' });
  });

  it('rejects a broken amount', () => {
    const broken = JSON.stringify(backup({ entries: [{ ...entry, amount: 'сто' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Записи дневника в файле повреждены' });
  });

  it('rejects broken custom foods', () => {
    const broken = JSON.stringify(backup({ customFoods: [{ ...customFood, kcal: 'много' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Свои блюда в файле повреждены' });
  });

  it('reads a backup made before custom foods existed', () => {
    const { customFoods, ...older } = backup({ entries: [entry] });
    const result = readBackup(JSON.stringify(older));

    expect(result.ok && result.backup.customFoods).toEqual([]);
  });

  it('rejects a broken weight log', () => {
    const broken = JSON.stringify(backup({ weightLog: [{ date: '2026-08-19' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'История веса в файле повреждена' });
  });

  it('rejects a broken profile', () => {
    const broken = JSON.stringify(backup({ profile: { id: 'me', birthDate: 'тридцать' } as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Профиль в файле повреждён' });
  });

  it('accepts a profile with and without target weight', () => {
    expect(readBackup(JSON.stringify(backup({ profile: { ...profile, targetWeightKg: 78 } as never })))).toMatchObject({ ok: true });
    expect(readBackup(JSON.stringify(backup({ profile: profile as never })))).toMatchObject({ ok: true });
  });

  it('rejects target weight as a string', () => {
    const broken = JSON.stringify(backup({ profile: { ...profile, targetWeightKg: '78' } as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Профиль в файле повреждён' });
  });

  it('accepts an empty backup without profile', () => {
    expect(readBackup(JSON.stringify(backup()))).toMatchObject({ ok: true });
  });

  it('rejects TDEE correction as a string', () => {
    const broken = JSON.stringify(backup({ profile: { ...profile, tdeeCorrectionKcal: '-200' } as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Профиль в файле повреждён' });
  });

  it('drops unknown top-level fields', () => {
    const result = readBackup(JSON.stringify({ ...backup(), сюрприз: true }));

    expect(result.ok && Object.keys(result.backup).sort()).toEqual([
      'customFoods',
      'entries',
      'exportedAt',
      'profile',
      'version',
      'weightLog',
    ]);
  });
});
