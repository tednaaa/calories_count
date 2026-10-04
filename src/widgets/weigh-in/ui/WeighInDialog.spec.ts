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

describe('weigh-in dialog', () => {
  it('prefills the last weight with a decimal comma', async () => {
    await mountDialog(85.4);

    expect(document.querySelector<HTMLInputElement>('#weigh-in-kg')!.value).toBe('85,4');
  });

  it('blocks saving a weight out of range', async () => {
    await mountDialog();
    const input = document.querySelector<HTMLInputElement>('#weigh-in-kg')!;
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(saveButton().disabled).toBe(true);
    expect(document.body.textContent).toContain('от 30 до 300 кг');
  });

  it('records the weight and closes', async () => {
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

  it('postpone button closes without recording', async () => {
    const wrapper = await mountDialog(85.4);

    [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Взвешусь завтра')!.click();
    await flushPromises();

    expect(recordWeight).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(localStorage.getItem('weigh-in-postponed-on')).toBe(toDateKey());
  });
});
