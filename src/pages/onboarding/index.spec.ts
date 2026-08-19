import { mount } from '@vue/test-utils';
import { calcTarget, saveProfile } from '@/entities/profile';
import { formatNumber } from '@/shared/lib';
import OnboardingView from './index.vue';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  saveProfile: vi.fn(),
}));

async function fill(wrapper: ReturnType<typeof mount>, values: Record<string, string>) {
  for (const [id, value] of Object.entries(values)) {
    await wrapper.find(`#${id}`).setValue(value);
  }
}

function mountForm() {
  return mount(OnboardingView);
}

describe('форма расчёта нормы', () => {
  it('без заполнения просит ввести данные и блокирует кнопку', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('Заполни возраст, рост и вес');
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('показывает норму, совпадающую с расчётом', async () => {
    const wrapper = mountForm();
    await fill(wrapper, { age: '30', height: '180', weight: '85' });

    const expected = calcTarget({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 85,
      activity: 'moderate',
      goal: 'cutMild',
    }).target;

    expect(expected).toBe(2410);
    expect(wrapper.text()).toContain(formatNumber(expected));
  });

  it('пересчитывает норму при смене цели', async () => {
    const wrapper = mountForm();
    await fill(wrapper, { age: '30', height: '180', weight: '85' });

    const selects = wrapper.findAll('select');
    await selects[1].setValue('bulk');

    expect(wrapper.text()).not.toContain(formatNumber(2410));
    expect(wrapper.text()).toContain(formatNumber(3260));
  });

  it('пересчитывает норму при смене активности', async () => {
    const wrapper = mountForm();
    await fill(wrapper, { age: '30', height: '180', weight: '85' });

    const selects = wrapper.findAll('select');
    await selects[0].setValue('sedentary');

    expect(wrapper.text()).not.toContain(formatNumber(2410));
  });

  it('блокирует кнопку при значении вне допустимых границ', async () => {
    const wrapper = mountForm();
    await fill(wrapper, { age: '12', height: '180', weight: '85' });

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('сохраняет профиль числами и уводит на главную', async () => {
    const wrapper = mountForm();
    await fill(wrapper, { age: '30', height: '180', weight: '85' });
    await wrapper.find('form').trigger('submit');

    expect(saveProfile).toHaveBeenCalledWith({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 85,
      activity: 'moderate',
      goal: 'cutMild',
    });
    expect(push).toHaveBeenCalledWith('/');
  });

  it('не сохраняет профиль при незаполненной форме', async () => {
    const wrapper = mountForm();
    await wrapper.find('form').trigger('submit');

    expect(saveProfile).not.toHaveBeenCalled();
  });
});
