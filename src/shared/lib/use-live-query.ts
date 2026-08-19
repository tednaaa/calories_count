import type { Ref } from 'vue';
import { liveQuery } from 'dexie';
import { onScopeDispose, ref } from 'vue';

export function useLiveQuery<T>(querier: () => T | Promise<T>, initial: T): Ref<T> {
  const value = ref(initial) as Ref<T>;

  const subscription = liveQuery(querier).subscribe({
    next: (result) => {
      value.value = result;
    },
    error: (error) => {
      console.error('[useLiveQuery]', error);
    },
  });

  onScopeDispose(() => subscription.unsubscribe());

  return value;
}
