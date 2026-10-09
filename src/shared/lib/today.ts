import type { Ref } from 'vue';
import type { DateKey } from './date';
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';
import { readonly, ref, watch } from 'vue';
import { toDateKey } from './date';

const CHECK_EVERY_MS = 60_000;

export function useToday(): Readonly<Ref<DateKey>> {
	const today = ref(toDateKey());

	function refresh() {
		today.value = toDateKey();
	}

	watch(useDocumentVisibility(), refresh);
	useIntervalFn(refresh, CHECK_EVERY_MS);

	return readonly(today);
}
