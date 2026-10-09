import type { Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { saveProfile } from '@/entities/profile';
import { toDateKey, useLiveQuery, yearsBefore } from '@/shared/lib';
import ProfileView from './profile.vue';

vi.mock('vue-router', () => ({
	RouterLink: { template: '<a><slot /></a>' },
}));

vi.mock('shonk-ui', async importOriginal => ({
	...await importOriginal<typeof import('shonk-ui')>(),
	toast: vi.fn(),
}));

vi.mock('@/entities/profile', async importOriginal => ({
	...await importOriginal<typeof import('@/entities/profile')>(),
	loadProfile: vi.fn(),
	saveProfile: vi.fn(),
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
		birthDate: yearsBefore(toDateKey(), 30),
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

beforeEach(() => {
	profile.value = saved();
	vi.mocked(useLiveQuery).mockImplementation(() => profile as never);
});

describe('profile screen', () => {
	it('shows the saved profile', () => {
		expect((mount(ProfileView).find('#weight').element as HTMLInputElement).value).toBe('85');
	});

	it('disables saving until something changes', () => {
		const wrapper = mount(ProfileView);

		expect(wrapper.findElementByText('button', 'Сохранить профиль').attributes('disabled')).toBeDefined();
	});

	it('saves the changed weight', async () => {
		const wrapper = mount(ProfileView);
		await wrapper.find('#weight').setValue('82');
		await wrapper.find('form').trigger('submit');

		expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 82 }));
	});

	it('reports a target weight error separately from height or weight errors', async () => {
		const wrapper = mount(ProfileView);
		await wrapper.find('#target-weight').setValue('500');

		expect(wrapper.text()).toContain('Целевой вес — число от 30 до 300 кг');
		expect(wrapper.text()).not.toContain('выходят за разумные границы');
		expect(wrapper.text()).toContain('Расчётная норма');
		expect(wrapper.findElementByText('button', 'Сохранить профиль').attributes('disabled')).toBeDefined();
	});
});
