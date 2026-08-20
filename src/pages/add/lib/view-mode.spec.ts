import { viewModeName, viewModes } from './view-mode';

describe('viewModeName', () => {
  it('называет вид по-русски', () => {
    expect(viewModeName('list')).toBe('Список');
  });

  it('незнакомый вид из хранилища называет первым', () => {
    expect(viewModeName('карточки' as never)).toBe(viewModes[0].name);
  });
});
