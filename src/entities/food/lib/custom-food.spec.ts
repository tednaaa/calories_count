import type { CustomFood } from '@/shared/db';
import { buildCustomFood, nextCustomFood, photosById } from './custom-food';

const NOW = 1_770_000_000_000;

const stored: CustomFood = {
  id: 'pie',
  name: 'Пирог у бабушки',
  kcal: 350,
  photo: 'data:image/jpeg;base64,zzz',
  createdAt: NOW,
  updatedAt: NOW,
};

describe('buildCustomFood', () => {
  it('creates a food with its own id', () => {
    const food = buildCustomFood({ name: 'Пирог', kcal: 350 }, NOW);

    expect(food.id).not.toBe('');
    expect(food.name).toBe('Пирог');
    expect(food.kcal).toBe(350);
    expect(food.createdAt).toBe(NOW);
    expect(food.updatedAt).toBe(NOW);
  });
});

describe('nextCustomFood', () => {
  it('keeps id and creation date', () => {
    const next = nextCustomFood(stored, { name: 'Пирог', kcal: 400 }, NOW + 1000);

    expect(next.id).toBe(stored.id);
    expect(next.createdAt).toBe(stored.createdAt);
    expect(next.updatedAt).toBe(NOW + 1000);
  });

  it('drops a removed amount', () => {
    const weighed: CustomFood = { ...stored, kcal: 351, amount: 130, basis: { amount: 100, kcal: 270 } };
    const next = nextCustomFood(weighed, { name: weighed.name, kcal: 350 }, NOW);

    expect(next.amount).toBeUndefined();
    expect(next.basis).toBeUndefined();
  });

  it('drops a removed photo', () => {
    expect(nextCustomFood(stored, { name: stored.name, kcal: stored.kcal }, NOW).photo).toBeUndefined();
  });
});

describe('photosById', () => {
  it('finds a photo by food id', () => {
    expect(photosById([stored]).get('pie')).toBe('data:image/jpeg;base64,zzz');
  });
});
