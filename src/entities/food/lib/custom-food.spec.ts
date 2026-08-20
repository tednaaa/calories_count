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
  it('заводит блюдо с собственным идентификатором', () => {
    const food = buildCustomFood({ name: 'Пирог', kcal: 350 }, NOW);

    expect(food.id).not.toBe('');
    expect(food.name).toBe('Пирог');
    expect(food.kcal).toBe(350);
    expect(food.createdAt).toBe(NOW);
    expect(food.updatedAt).toBe(NOW);
  });

  it('два блюда с одним названием остаются разными', () => {
    const first = buildCustomFood({ name: 'Пирог', kcal: 350 }, NOW);
    const second = buildCustomFood({ name: 'Пирог', kcal: 350 }, NOW);

    expect(first.id).not.toBe(second.id);
  });
});

describe('nextCustomFood', () => {
  it('сохраняет идентификатор и дату заведения', () => {
    const next = nextCustomFood(stored, { name: 'Пирог', kcal: 400 }, NOW + 1000);

    expect(next.id).toBe(stored.id);
    expect(next.createdAt).toBe(stored.createdAt);
    expect(next.updatedAt).toBe(NOW + 1000);
  });

  it('снятое фото действительно пропадает', () => {
    expect(nextCustomFood(stored, { name: stored.name, kcal: stored.kcal }, NOW).photo).toBeUndefined();
  });
});

describe('photosById', () => {
  it('находит фото по идентификатору блюда', () => {
    expect(photosById([stored]).get('pie')).toBe('data:image/jpeg;base64,zzz');
  });

  it('о блюде без фото знает, что фото нет', () => {
    const photos = photosById([{ ...stored, photo: undefined }]);

    expect(photos.get('pie')).toBeUndefined();
  });

  it('чужой идентификатор ничего не находит', () => {
    expect(photosById([stored]).get('coffee-black')).toBeUndefined();
  });
});
