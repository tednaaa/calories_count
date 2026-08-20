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

describe('экран «Своё блюдо»', () => {
  it('до заполнения формы сохранять нечего', () => {
    const wrapper = mount(CustomView);

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('по умолчанию пишет разовую запись и блюдо не заводит', async () => {
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

  it('с поднятым флагом заводит блюдо и пишет его в день', async () => {
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

  it('флаг возвращается обратно', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('#custom-saves').trigger('click');
    await wrapper.find('#custom-saves').trigger('click');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalled();
    expect(addCustomFoodToDay).not.toHaveBeenCalled();
  });

  it('пишет запись в дату из адреса и возвращает на тот же день', async () => {
    route.query = { date: '2026-08-17' };

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledWith('2026-08-17', expect.anything());
    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-17' } });
  });

  it('прикладывает выбранное фото', async () => {
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

  it('нечитаемое фото не роняет форму', async () => {
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

  it('при ошибке записи оставляет форму и даёт повторить', async () => {
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

  it('не сохраняет дважды по двойной отправке', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');

    const form = wrapper.find('form');
    await form.trigger('submit');
    await form.trigger('submit');
    await flushPromises();

    expect(addCustomOnceToDay).toHaveBeenCalledTimes(1);
  });
});
