import { viewModeName, viewModes } from './view-mode';

describe('viewModeName', () => {
  it('names the view in Russian', () => {
    expect(viewModeName('list')).toBe('Список');
  });

  it('falls back to the first view name for an unknown stored view', () => {
    expect(viewModeName('карточки' as never)).toBe(viewModes[0].name);
  });
});
