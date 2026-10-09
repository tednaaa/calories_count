import { flushPromises, mount } from '@vue/test-utils';
import { downloadBlob, toast } from 'shonk-ui';
import { applyBackup, BACKUP_VERSION, collectBackup, wipeAllData } from '@/shared/db';
import DataView from './data.vue';

const { push, requireConfirm } = vi.hoisted(() => ({ push: vi.fn(), requireConfirm: vi.fn() }));

vi.mock('vue-router', () => ({
	RouterLink: { template: '<a><slot /></a>' },
	useRouter: () => ({ push }),
}));

vi.mock('shonk-ui', async importOriginal => ({
	...await importOriginal<typeof import('shonk-ui')>(),
	toast: vi.fn(),
	downloadBlob: vi.fn(),
	useConfirm: () => ({ require: requireConfirm }),
}));

vi.mock('@/shared/db', async importOriginal => ({
	...await importOriginal<typeof import('@/shared/db')>(),
	collectBackup: vi.fn(),
	applyBackup: vi.fn(),
	wipeAllData: vi.fn(),
}));

function backupJson(entries: unknown[] = []) {
	return JSON.stringify({
		version: BACKUP_VERSION,
		exportedAt: '2026-08-19T12:00:00.000Z',
		profile: null,
		entries,
		customFoods: [],
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

describe('data screen', () => {
	it('exports a backup file', async () => {
		vi.mocked(collectBackup).mockResolvedValue({
			version: BACKUP_VERSION,
			exportedAt: '',
			profile: null,
			entries: [],
			customFoods: [],
			weightLog: [],
		});

		const wrapper = mount(DataView);
		await wrapper.findElementByText('button', 'Выгрузить копию').trigger('click');
		await flushPromises();

		expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/^calories-count-\d{4}-\d{2}-\d{2}\.json$/));
	});

	it('explains why the file was rejected', async () => {
		const wrapper = mount(DataView);
		await chooseFile(wrapper, 'не json');

		expect(toast).toHaveBeenCalledWith('Файл не похож на JSON');
		expect(wrapper.text()).not.toContain('Заменить всё');
	});

	it('shows the backup contents before importing', async () => {
		const wrapper = mount(DataView);
		await chooseFile(wrapper, backupJson([{
			id: 'entry-1',
			date: '2026-08-19',
			createdAt: 1,
			foodId: 'apple',
			qty: 1,
			kcalPerPortion: 80,
			name: 'Яблоко',
		}]));

		expect(wrapper.text()).toContain('записей: 1, своих блюд: 0, профиль: нет, замеров веса: 0');
	});

	it('imports the backup in the chosen mode', async () => {
		const wrapper = mount(DataView);
		await chooseFile(wrapper, backupJson());
		await wrapper.findElementByText('button', 'Дополнить').trigger('click');
		await flushPromises();

		expect(applyBackup).toHaveBeenCalledWith(expect.objectContaining({ entries: [] }), 'merge');
		expect(wrapper.text()).not.toContain('Дополнить');
	});

	it('wipes data only after confirmation', async () => {
		const wrapper = mount(DataView);
		await wrapper.findElementByText('button', 'Стереть все данные').trigger('click');

		expect(wipeAllData).not.toHaveBeenCalled();

		const options = requireConfirm.mock.calls[0][0] as { acceptButtonText: string; accept: () => void };

		options.accept();
		await flushPromises();

		expect(wipeAllData).toHaveBeenCalled();
		expect(push).toHaveBeenCalledWith('/');
	});
});
