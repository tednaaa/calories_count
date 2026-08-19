import type { Ref, WatchSource } from 'vue';
import { liveQuery } from 'dexie';
import { onScopeDispose, ref, watch } from 'vue';

interface Subscription {
  unsubscribe: () => void;
}

export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  initial: T,
  deps: WatchSource[] = [],
): Ref<T> {
  const value = ref(initial) as Ref<T>;
  let subscription: Subscription | undefined;

  function subscribe() {
    subscription?.unsubscribe();
    subscription = liveQuery(querier).subscribe({
      next: (result) => {
        value.value = result;
      },
      error: (error) => {
        console.error('[useLiveQuery]', error);
      },
    });
  }

  subscribe();
  watch(deps, subscribe);
  onScopeDispose(() => subscription?.unsubscribe());

  return value;
}
