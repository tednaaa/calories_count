import type { RemovableRef } from '@vueuse/core';
import type { DateKey } from '@/shared/lib';
import { useLocalStorage } from '@vueuse/core';
import { daysBetween, toDateKey } from '@/shared/lib';

export const REMINDER_ENABLED_KEY = 'weigh-in-reminder';
export const REMINDER_POSTPONED_KEY = 'weigh-in-postponed-on';
export const REMIND_AFTER_DAYS = 2;

export interface ReminderState {
	lastDate: DateKey | undefined;
	today: DateKey;
	postponedOn: string;
	enabled: boolean;
}

export function shouldRemindWeighIn({ lastDate, today, postponedOn, enabled }: ReminderState): boolean {
	return enabled
		&& postponedOn !== today
		&& (lastDate === undefined || daysBetween(lastDate, today) >= REMIND_AFTER_DAYS);
}

export function useWeighInReminder(): {
	enabled: RemovableRef<boolean>;
	postponedOn: RemovableRef<string>;
	postpone: () => void;
} {
	const enabled = useLocalStorage(REMINDER_ENABLED_KEY, true);
	const postponedOn = useLocalStorage(REMINDER_POSTPONED_KEY, '');

	function postpone() {
		postponedOn.value = toDateKey();
	}

	return { enabled, postponedOn, postpone };
}
