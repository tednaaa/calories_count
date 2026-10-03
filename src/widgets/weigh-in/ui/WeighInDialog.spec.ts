import { flushPromises, mount } from '@vue/test-utils';
import { recordWeight } from '@/entities/profile';
import { toDateKey } from '@/shared/lib';
import WeighInDialog from './WeighInDialog.vue';

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  recordWeight: vi.fn(),
}));

async function mountDialog(lastKg?: number) {
  const wrapper = mount(WeighInDialog, {
    props: { 'open': true, lastKg, 'onUpdate:open': vi.fn() },
    global: { stubs: { teleport: false } },
    attachTo: document.body,
  });
  await flushPromises();

  return wrapper;
}

function saveButton() {
  return [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Сохранить')!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('диалог взвешивания', () => {
  it('подставляет последний вес через запятую', async () => {
    await mountDialog(85.4);

    expect(document.querySelector<HTMLInputElement>('#weigh-in-kg')!.value).toBe('85,4');
  });

  it('советует взвешиваться в одно время и не корит за пропуск', async () => {
    await mountDialog();

    expect(document.body.textContent).toContain('в одно и то же время');
    expect(document.body.textContent).toContain('взвесьтесь завтра');
  });

  it('не даёт сохранить вес вне пределов', async () => {
    await mountDialog();
    const input = document.querySelector<HTMLInputElement>('#weigh-in-kg')!;
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(saveButton().disabled).toBe(true);
    expect(document.body.textContent).toContain('от 30 до 300 кг');
  });

  it('записывает вес и закрывается', async () => {
    const wrapper = await mountDialog(85.4);
    const input = document.querySelector<HTMLInputElement>('#weigh-in-kg')!;
    input.value = '84,2';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    saveButton().click();
    await flushPromises();

    expect(recordWeight).toHaveBeenCalledWith(84.2);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('«Взвешусь завтра» закрывает без записи', async () => {
    const wrapper = await mountDialog(85.4);

    [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Взвешусь завтра')!.click();
    await flushPromises();

    expect(recordWeight).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(localStorage.getItem('weigh-in-postponed-on')).toBe(toDateKey());
  });
});
