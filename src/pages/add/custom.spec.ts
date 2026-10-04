import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { readPhoto, toDateKey } from '@/shared/lib';
import CustomView from './custom.vue';
import { addCustomFoodToDay, addCustomOnceToDay } from './lib/custom';

const { push, route } = vi.hoisted(() => ({
  push: vi.fn(),
  route: { query: {} as Record<string, unknown> },
}));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => route,
  useRouter: () => ({ push }),
}));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
}));

vi.mock('./lib/custom', () => ({
  addCustomFoodToDay: vi.fn(),
  addCustomOnceToDay: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  readPhoto: vi.fn(),
}));

beforeEach(() => {
  route.query = {};
});

async function fill(wrapper: ReturnType<typeof mount>, name: string, kcal: string) {
  await wrapper.find('#custom-name').setValue(name);
  await wrapper.find('#custom-kcal').setValue(kcal);
}

async function attachPhoto(wrapper: ReturnType<typeof mount>) {
  const input = wrapper.find('input[type="file"]');

  Object.defineProperty(input.element, 'files', {
    configurable: true,
    value: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })],
  });

  await input.trigger('change');
  await flushPromises();
}

describe('custom food screen', () => {
  it('disables save until the form is filled', () => {
    const wrapper = mount(CustomView);

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('adds a one-off entry without creating a food by default', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог у бабушки', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledWith(toDateKey(), {
      name: 'Пирог у бабушки',
      kcal: 350,
      photo: undefined,
    });
    expect(addCustomFoodToDay).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({ path: '/', query: {} });
  });

  it('creates a food and adds it to the day when the toggle is on', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог у бабушки', '350');
    await wrapper.find('#custom-saves').trigger('click');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomFoodToDay).toHaveBeenCalledWith(toDateKey(), {
      name: 'Пирог у бабушки',
      kcal: 350,
      photo: undefined,
    });
    expect(addCustomOnceToDay).not.toHaveBeenCalled();
  });

  it('toggles the flag back off', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('#custom-saves').trigger('click');
    await wrapper.find('#custom-saves').trigger('click');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalled();
    expect(addCustomFoodToDay).not.toHaveBeenCalled();
  });

  it('adds the entry to the url date and returns to that day', async () => {
    route.query = { date: '2026-08-17' };

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledWith('2026-08-17', expect.anything());
    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-17' } });
  });

  it('attaches the picked photo', async () => {
    vi.mocked(readPhoto).mockResolvedValueOnce('data:image/jpeg;base64,zzz');

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await attachPhoto(wrapper);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledWith(toDateKey(), expect.objectContaining({
      photo: 'data:image/jpeg;base64,zzz',
    }));
  });

  it('survives an unreadable photo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(readPhoto).mockRejectedValueOnce(new Error('broken'));

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await attachPhoto(wrapper);

    expect(toast).toHaveBeenCalledWith('Не удалось прочитать фото');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledWith(toDateKey(), expect.objectContaining({
      photo: undefined,
    }));
  });

  it('keeps the form and allows retry on save error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(addCustomOnceToDay).mockRejectedValueOnce(new Error('quota'));

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(toast).toHaveBeenCalledWith('Не удалось сохранить, попробуй ещё раз');
    expect(push).not.toHaveBeenCalled();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledTimes(2);
  });

  it('does not save twice on double submit', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');

    const form = wrapper.find('form');
    await form.trigger('submit');
    await form.trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledTimes(1);
  });
});
