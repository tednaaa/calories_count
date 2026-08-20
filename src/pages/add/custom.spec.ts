import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { addCustomEntry } from '@/entities/entry';
import { readPhoto, toDateKey } from '@/shared/lib';
import CustomView from './custom.vue';

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

vi.mock('@/entities/entry', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/entry')>(),
  addCustomEntry: vi.fn(),
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

  it('сохраняет разовую запись за сегодня и уводит на главную', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог у бабушки', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomEntry).toHaveBeenCalledWith(toDateKey(), {
      name: 'Пирог у бабушки',
      kcalPerPortion: 350,
      photo: undefined,
    });
    expect(push).toHaveBeenCalledWith({ path: '/', query: {} });
  });

  it('пишет запись в дату из адреса и возвращает на тот же день', async () => {
    route.query = { date: '2026-08-17' };

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomEntry).toHaveBeenCalledWith('2026-08-17', expect.anything());
    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-17' } });
  });

  it('прикладывает выбранное фото', async () => {
    vi.mocked(readPhoto).mockResolvedValueOnce('data:image/jpeg;base64,zzz');

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await attachPhoto(wrapper);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomEntry).toHaveBeenCalledWith(toDateKey(), expect.objectContaining({
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

    expect(addCustomEntry).toHaveBeenCalledWith(toDateKey(), expect.objectContaining({
      photo: undefined,
    }));
  });

  it('при ошибке записи оставляет форму и даёт повторить', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(addCustomEntry).mockRejectedValueOnce(new Error('quota'));

    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(toast).toHaveBeenCalledWith('Не удалось сохранить, попробуй ещё раз');
    expect(push).not.toHaveBeenCalled();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(addCustomEntry).toHaveBeenCalledTimes(2);
  });

  it('не сохраняет дважды по двойной отправке', async () => {
    const wrapper = mount(CustomView);
    await fill(wrapper, 'Пирог', '350');

    const form = wrapper.find('form');
    await form.trigger('submit');
    await form.trigger('submit');
    await flushPromises();

    expect(addCustomEntry).toHaveBeenCalledTimes(1);
  });
});
