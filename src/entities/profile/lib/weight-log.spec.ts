import type { WeightRecord } from '@/shared/db';
import { nextWeightRecord } from './weight-log';

describe('nextWeightRecord', () => {
  it('заводит новую запись, когда за дату ничего нет', () => {
    expect(nextWeightRecord(undefined, '2026-10-03', 85.4, 1000)).toEqual({ date: '2026-10-03', kg: 85.4, createdAt: 1000 });
  });

  it('перезаписывает замер за ту же дату, сохраняя его id', () => {
    const existing: WeightRecord = { id: 7, date: '2026-10-03', kg: 86, createdAt: 500 };

    expect(nextWeightRecord(existing, '2026-10-03', 85.4, 1000)).toEqual({ id: 7, date: '2026-10-03', kg: 85.4, createdAt: 1000 });
  });
});
