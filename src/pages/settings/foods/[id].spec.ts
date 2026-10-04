import type { CustomFood } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { loadCustomFood, removeCustomFood, saveCustomFood } from '@/entities/food';
import CustomFoodView from './[id].vue';

const { push, replace, requireConfirm } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  requireConfirm: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => ({ params: { id: 'pie' } }),
  useRouter: () => ({ push, replace }),
}));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
  useConfirm: () => ({ require: requireConfirm }),
}));

vi.mock('@/entities/food', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/food')>(),
  loadCustomFood: vi.fn(),
  saveCustomFood: vi.fn(),
  removeCustomFood: vi.fn(),
}));

const stored: CustomFood = {
  id: 'pie',
  name: 'Пирог у бабушки',
  kcal: 350,
  createdAt: 1_770_000_000_000,
  updatedAt: 1_770_000_000_000,
};

async function open() {
  const wrapper = mount(CustomFoodView);

  await flushPromises();

  return wrapper;
}

beforeEach(() => {
  vi.mocked(loadCustomFood).mockResolvedValue(stored);
});

describe('custom food editing', () => {
  it('opens with the saved values', async () => {
    const wrapper = await open();

    expect((wrapper.find('#custom-name').element as HTMLInputElement).value).toBe('Пирог у бабушки');
    expect((wrapper.find('#custom-kcal').element as HTMLInputElement).value).toBe('350');
  });

  it('saves the edit and returns to the list', async () => {
    const wrapper = await open();
    await wrapper.find('#custom-kcal').setValue('400');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(saveCustomFood).toHaveBeenCalledWith(stored, {
      name: 'Пирог у бабушки',
      kcal: 400,
      photo: undefined,
    });
    expect(push).toHaveBeenCalledWith('/settings/foods');
  });

  it('keeps the form and allows a retry when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(saveCustomFood).mockRejectedValueOnce(new Error('quota'));

    const wrapper = await open();
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(toast).toHaveBeenCalledWith('Не удалось сохранить, попробуй ещё раз');
    expect(push).not.toHaveBeenCalled();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(saveCustomFood).toHaveBeenCalledTimes(2);
  });

  it('deletes only after confirmation', async () => {
    const wrapper = await open();
    await wrapper.findElementByText('button', 'Удалить блюдо из избранных').trigger('click');

    expect(removeCustomFood).not.toHaveBeenCalled();

    const options = requireConfirm.mock.calls[0][0] as { message: string; accept: () => void };
    expect(options.message).toContain('Записи в дневнике останутся');

    options.accept();
    await flushPromises();

    expect(removeCustomFood).toHaveBeenCalledWith('pie');
    expect(push).toHaveBeenCalledWith('/settings/foods');
  });

  it('redirects to the list when the food no longer exists', async () => {
    vi.mocked(loadCustomFood).mockResolvedValue(undefined);

    const wrapper = await open();

    expect(replace).toHaveBeenCalledWith('/settings/foods');
    expect(wrapper.find('form').exists()).toBe(false);
  });
});
