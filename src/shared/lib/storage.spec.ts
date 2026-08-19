import { requestPersistentStorage } from './storage';

describe('requestPersistentStorage', () => {
  it('просит браузер не вычищать хранилище', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalled();
  });

  it('там, где такого API нет, тихо сдаётся', async () => {
    vi.stubGlobal('navigator', { storage: {} });

    await expect(requestPersistentStorage()).resolves.toBe(false);
  });

  it('переживает браузер вообще без storage', async () => {
    vi.stubGlobal('navigator', {});

    await expect(requestPersistentStorage()).resolves.toBe(false);
  });
});
