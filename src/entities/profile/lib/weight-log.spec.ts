import type { WeightRecord } from '@/shared/db';
import { nextWeightRecord } from './weight-log';

describe('nextWeightRecord', () => {
  it('creates a new record when the date has none', () => {
    expect(nextWeightRecord(undefined, '2026-10-03', 85.4, 1000)).toEqual({ date: '2026-10-03', kg: 85.4, createdAt: 1000 });
  });

  it('overwrites the record for the same date keeping its id', () => {
    const existing: WeightRecord = { id: 7, date: '2026-10-03', kg: 86, createdAt: 500 };

    expect(nextWeightRecord(existing, '2026-10-03', 85.4, 1000)).toEqual({ id: 7, date: '2026-10-03', kg: 85.4, createdAt: 1000 });
  });
});
