import type { Backup } from './backup';
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
  age: 30,
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
  it('называет файл датой выгрузки', () => {
    expect(backupFileName(new Date(2026, 7, 19))).toBe('calories-count-2026-08-19.json');
  });
});

describe('describeBackup', () => {
  it('перечисляет, что лежит внутри копии', () => {
    const described = describeBackup(backup({ entries: [entry], profile: profile as never }));

    expect(described).toBe('записей: 1, своих блюд: 0, профиль: есть, замеров веса: 0');
  });

  it('считает свои блюда', () => {
    expect(describeBackup(backup({ customFoods: [customFood] }))).toContain('своих блюд: 1');
  });

  it('честно говорит, что профиля нет', () => {
    expect(describeBackup(backup())).toContain('профиль: нет');
  });
});

describe('readBackup', () => {
  it('принимает собственную выгрузку', () => {
    const result = readBackup(JSON.stringify(backup({ entries: [entry], profile: profile as never })));

    expect(result).toMatchObject({ ok: true });
  });

  it('отвергает не-JSON', () => {
    expect(readBackup('привет')).toEqual({ ok: false, reason: 'Файл не похож на JSON' });
  });

  it('отвергает чужой формат', () => {
    expect(readBackup(JSON.stringify({ entries: [] }))).toMatchObject({ ok: false });
    expect(readBackup(JSON.stringify(backup({ version: 99 })))).toMatchObject({ ok: false });
  });

  it('отвергает битые записи дневника', () => {
    const broken = JSON.stringify(backup({ entries: [{ ...entry, qty: 'два' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Записи дневника в файле повреждены' });
  });

  it('отвергает битые свои блюда', () => {
    const broken = JSON.stringify(backup({ customFoods: [{ ...customFood, kcal: 'много' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Свои блюда в файле повреждены' });
  });

  it('читает копию, выгруженную до появления своих блюд', () => {
    const { customFoods, ...older } = backup({ entries: [entry] });
    const result = readBackup(JSON.stringify(older));

    expect(result.ok && result.backup.customFoods).toEqual([]);
  });

  it('отвергает битую историю веса', () => {
    const broken = JSON.stringify(backup({ weightLog: [{ date: '2026-08-19' }] as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'История веса в файле повреждена' });
  });

  it('отвергает битый профиль', () => {
    const broken = JSON.stringify(backup({ profile: { id: 'me', age: 'тридцать' } as never }));

    expect(readBackup(broken)).toEqual({ ok: false, reason: 'Профиль в файле повреждён' });
  });

  it('пустая копия без профиля — это нормально', () => {
    expect(readBackup(JSON.stringify(backup()))).toMatchObject({ ok: true });
  });

  it('не тащит в базу посторонние поля файла', () => {
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
