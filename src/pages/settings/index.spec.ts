import type { Profile } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { downloadFile, toast } from 'shonk-ui';
import { ref } from 'vue';
import { resetTargetToCalculated, saveProfile, setManualTarget } from '@/entities/profile';
import { applyBackup, BACKUP_VERSION, collectBackup, wipeAllData } from '@/shared/db';
import { useLiveQuery } from '@/shared/lib';
import SettingsView from './index.vue';

const { push, requireConfirm } = vi.hoisted(() => ({ push: vi.fn(), requireConfirm: vi.fn() }));

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
  downloadFile: vi.fn(),
  useConfirm: () => ({ require: requireConfirm }),
}));

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
  setManualTarget: vi.fn(),
  resetTargetToCalculated: vi.fn(),
}));

vi.mock('@/shared/db', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/db')>(),
  collectBackup: vi.fn(),
  applyBackup: vi.fn(),
  wipeAllData: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  useLiveQuery: vi.fn(),
}));

const profile = ref<Profile | undefined>(undefined);

function saved(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'me',
    sex: 'male',
    age: 30,
    heightCm: 180,
    weightKg: 85,
    activity: 'moderate',
    goal: 'cutMild',
    targetKcal: 2410,
    targetOverridden: false,
    createdAt: 1_755_600_000_000,
    updatedAt: 1_755_600_000_000,
    ...overrides,
  };
}

function backupJson(entries: unknown[] = []) {
  return JSON.stringify({
    version: BACKUP_VERSION,
    exportedAt: '2026-08-19T12:00:00.000Z',
    profile: null,
    entries,
    weightLog: [],
  });
}

async function chooseFile(wrapper: ReturnType<typeof mount>, contents: string) {
  const input = wrapper.find('input[type="file"]');
  const file = new File([contents], 'backup.json', { type: 'application/json' });

  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
}

beforeEach(() => {
  profile.value = saved();
  vi.mocked(useLiveQuery).mockImplementation(() => profile as never);
});

describe('экран настроек', () => {
  it('показывает сохранённую норму и профиль', () => {
    const wrapper = mount(SettingsView);

    expect(wrapper.text()).toContain('2 410');
    expect((wrapper.find('#weight').element as HTMLInputElement).value).toBe('85');
  });

  it('не даёт сохранить профиль, пока ничего не изменилось', () => {
    const wrapper = mount(SettingsView);

    expect(wrapper.findElementByText('button', 'Сохранить профиль').attributes('disabled')).toBeDefined();
  });

  it('сохраняет изменённый вес', async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find('#weight').setValue('82');
    await wrapper.find('form').trigger('submit');

    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 82 }));
  });

  it('показывает, как изменится расчётная норма', async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find('#weight').setValue('75');

    expect(wrapper.text()).toContain('Расчётная норма');
  });

  it('задаёт норму вручную', async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find('#target').setValue('2000');
    await wrapper.findElementByText('button', 'Задать').trigger('click');

    expect(setManualTarget).toHaveBeenCalledWith(2000);
  });

  it('не принимает норму за пределами разумного', async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find('#target').setValue('120');

    expect(wrapper.findElementByText('button', 'Задать').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('от 800 до 6 000');
  });

  it('вернуть расчётную предлагает только при ручной норме', async () => {
    const wrapper = mount(SettingsView);

    expect(wrapper.findElementByText('button', 'Вернуть расчётную')).toBeUndefined();

    profile.value = saved({ targetOverridden: true });
    await wrapper.vm.$nextTick();
    await wrapper.findElementByText('button', 'Вернуть расчётную').trigger('click');

    expect(resetTargetToCalculated).toHaveBeenCalled();
  });

  it('выгружает копию файлом', async () => {
    vi.mocked(collectBackup).mockResolvedValue({
      version: BACKUP_VERSION,
      exportedAt: '',
      profile: null,
      entries: [],
      weightLog: [],
    });

    const wrapper = mount(SettingsView);
    await wrapper.findElementByText('button', 'Выгрузить копию').trigger('click');
    await flushPromises();

    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/^calories-count-\d{4}-\d{2}-\d{2}\.json$/));
  });

  it('объясняет, почему файл не подошёл', async () => {
    const wrapper = mount(SettingsView);
    await chooseFile(wrapper, 'не json');

    expect(toast).toHaveBeenCalledWith('Файл не похож на JSON');
    expect(wrapper.text()).not.toContain('Заменить всё');
  });

  it('перед загрузкой копии показывает, что внутри', async () => {
    const wrapper = mount(SettingsView);
    await chooseFile(wrapper, backupJson([{
      id: 'entry-1',
      date: '2026-08-19',
      createdAt: 1,
      foodId: 'apple',
      qty: 1,
      kcalPerPortion: 80,
      name: 'Яблоко',
    }]));

    expect(wrapper.text()).toContain('записей: 1, профиль: нет, замеров веса: 0');
  });

  it('загружает копию выбранным способом', async () => {
    const wrapper = mount(SettingsView);
    await chooseFile(wrapper, backupJson());
    await wrapper.findElementByText('button', 'Дополнить').trigger('click');
    await flushPromises();

    expect(applyBackup).toHaveBeenCalledWith(expect.objectContaining({ entries: [] }), 'merge');
    expect(wrapper.text()).not.toContain('Дополнить');
  });

  it('стирает данные только после подтверждения', async () => {
    const wrapper = mount(SettingsView);
    await wrapper.findElementByText('button', 'Стереть все данные').trigger('click');

    expect(wipeAllData).not.toHaveBeenCalled();

    const options = requireConfirm.mock.calls[0][0] as { acceptLabel: string; accept: () => void };
    expect(options.acceptLabel).toBe('Стереть');

    options.accept();
    await flushPromises();

    expect(wipeAllData).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/');
  });

  it('рассказывает, как поставить на iPhone', () => {
    expect(mount(SettingsView).text()).toContain('На экран „Домой“');
  });
});
