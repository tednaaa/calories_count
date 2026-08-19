import { liveQuery } from 'dexie';
import { effectScope, nextTick, ref } from 'vue';
import { useLiveQuery } from './use-live-query';

vi.mock('dexie', () => ({ liveQuery: vi.fn() }));

const unsubscribe = vi.fn();
let emit: ((value: unknown) => void) | undefined;

beforeEach(() => {
  vi.mocked(liveQuery).mockImplementation(() => ({
    subscribe: (observer: { next: (value: unknown) => void }) => {
      emit = observer.next;
      return { unsubscribe };
    },
  }) as unknown as ReturnType<typeof liveQuery>);
});

describe('useLiveQuery', () => {
  it('подписывается сразу и отдаёт начальное значение', () => {
    const scope = effectScope();
    const result = scope.run(() => useLiveQuery(() => 'значение', 'начальное'));

    expect(result?.value).toBe('начальное');
    expect(liveQuery).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('обновляет значение при новом результате', () => {
    const scope = effectScope();
    const result = scope.run(() => useLiveQuery(() => 'значение', 'начальное'));

    emit?.('обновлённое');

    expect(result?.value).toBe('обновлённое');

    scope.stop();
  });

  it('пересоздаёт подписку при изменении зависимости', async () => {
    const scope = effectScope();
    const date = ref('2026-08-19');

    scope.run(() => useLiveQuery(() => date.value, '', [date]));
    expect(liveQuery).toHaveBeenCalledTimes(1);

    date.value = '2026-08-18';
    await nextTick();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(liveQuery).toHaveBeenCalledTimes(2);

    scope.stop();
  });

  it('без зависимостей подписку не пересоздаёт', async () => {
    const scope = effectScope();
    const unrelated = ref(1);

    scope.run(() => useLiveQuery(() => 'значение', ''));
    unrelated.value = 2;
    await nextTick();

    expect(liveQuery).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('отписывается при остановке области видимости', () => {
    const scope = effectScope();
    scope.run(() => useLiveQuery(() => 'значение', ''));

    scope.stop();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
