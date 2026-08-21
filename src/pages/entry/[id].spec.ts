import type { Entry } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { loadEntry, removeEntry, restoreEntry, saveEntry } from '@/entities/entry';
import EntryView from './[id].vue';

const { push, replace, requireConfirm } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  requireConfirm: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => ({ params: { id: 'entry-1' } }),
  useRouter: () => ({ push, replace }),
}));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
  useConfirm: () => ({ require: requireConfirm }),
}));

vi.mock('@/entities/entry', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/entry')>(),
  loadEntry: vi.fn(),
  saveEntry: vi.fn(),
  removeEntry: vi.fn(),
  restoreEntry: vi.fn(),
}));

const stored: Entry = {
  id: 'entry-1',
  date: '2026-08-19',
  createdAt: Date.parse('2026-08-19T09:15:00'),
  foodId: 'coffee-black',
  qty: 1,
  kcalPerPortion: 5,
  name: 'Кофе чёрный',
};

const day = { path: '/', query: { date: '2026-08-19' } };

async function open() {
  const wrapper = mount(EntryView);

  await flushPromises();

  return wrapper;
}

beforeEach(() => {
  vi.mocked(loadEntry).mockResolvedValue(stored);
});

describe('правка записи', () => {
  it('открывается на значениях записи', async () => {
    const wrapper = await open();

    expect((wrapper.find('#custom-name').element as HTMLInputElement).value).toBe('Кофе чёрный');
    expect((wrapper.find('#custom-kcal').element as HTMLInputElement).value).toBe('5');
    expect(wrapper.text()).toContain('Итого 5 ккал');
  });

  it('сохраняет правку и возвращает в день записи', async () => {
    const wrapper = await open();

    await wrapper.find('#custom-name').setValue('Кофе с молоком');
    await wrapper.find('#custom-kcal').setValue('40');
    await wrapper.find('[aria-label="Больше"]').trigger('click');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(saveEntry).toHaveBeenCalledWith(stored, { name: 'Кофе с молоком', kcalPerPortion: 40, photo: undefined }, 2);
    expect(toast).toHaveBeenCalledWith('Запись сохранена');
    expect(push).toHaveBeenCalledWith(day);
  });

  it('не сохраняет запись без названия', async () => {
    const wrapper = await open();

    await wrapper.find('#custom-name').setValue('   ');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(saveEntry).not.toHaveBeenCalled();
  });

  it('не опускает количество ниже половины порции', async () => {
    const wrapper = await open();
    const less = wrapper.find('[aria-label="Меньше"]');

    await less.trigger('click');
    expect(wrapper.text()).toContain('0.5');

    expect(less.attributes('disabled')).toBeDefined();
  });

  it('удаляет только после подтверждения и предлагает вернуть', async () => {
    const wrapper = await open();
    await wrapper.findElementByText('button', 'Удалить запись').trigger('click');

    expect(removeEntry).not.toHaveBeenCalled();

    const options = requireConfirm.mock.calls[0][0] as { message: string; accept: () => void };
    expect(options.message).toContain('Кофе чёрный');

    options.accept();
    await flushPromises();

    expect(removeEntry).toHaveBeenCalledWith('entry-1');
    expect(push).toHaveBeenCalledWith(day);

    const undo = vi.mocked(toast).mock.calls[0][1] as { action: { onClick: () => void } };
    undo.action.onClick();

    expect(restoreEntry).toHaveBeenCalledWith(stored);
  });

  it('пропавшую запись возвращает в сегодня', async () => {
    vi.mocked(loadEntry).mockResolvedValue(undefined);
    await open();

    expect(replace).toHaveBeenCalledWith('/');
  });
});
