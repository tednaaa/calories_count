import { requestPersistentStorage } from './storage';

describe('requestPersistentStorage', () => {
	it('asks the browser not to evict storage', async () => {
		const persist = vi.fn().mockResolvedValue(true);
		vi.stubGlobal('navigator', { storage: { persist } });

		await expect(requestPersistentStorage()).resolves.toBe(true);
		expect(persist).toHaveBeenCalled();
	});

	it('quietly gives up where the API is missing', async () => {
		vi.stubGlobal('navigator', { storage: {} });

		await expect(requestPersistentStorage()).resolves.toBe(false);
	});

	it('survives a browser without storage at all', async () => {
		vi.stubGlobal('navigator', {});

		await expect(requestPersistentStorage()).resolves.toBe(false);
	});
});
