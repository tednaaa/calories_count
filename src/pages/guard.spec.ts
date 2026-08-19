import { redirectFor } from './guard';

describe('redirectFor', () => {
  it('без профиля уводит на онбординг', () => {
    expect(redirectFor(false, '/')).toBe('/onboarding');
    expect(redirectFor(false, '/add')).toBe('/onboarding');
    expect(redirectFor(false, '/stats')).toBe('/onboarding');
  });

  it('без профиля пропускает сам онбординг', () => {
    expect(redirectFor(false, '/onboarding')).toBeUndefined();
  });

  it('с профилем уводит с онбординга на главную', () => {
    expect(redirectFor(true, '/onboarding')).toBe('/');
  });

  it('с профилем не мешает остальным маршрутам', () => {
    expect(redirectFor(true, '/')).toBeUndefined();
    expect(redirectFor(true, '/settings')).toBeUndefined();
  });

  it('цель редиректа никогда не редиректится дальше', () => {
    expect(redirectFor(false, redirectFor(false, '/') as string)).toBeUndefined();
    expect(redirectFor(true, redirectFor(true, '/onboarding') as string)).toBeUndefined();
  });
});
