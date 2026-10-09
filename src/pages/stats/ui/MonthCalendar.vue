<script setup lang="ts">
import type { DayVerdict } from '../lib/month';
import type { Goal } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { cn } from 'shonk-ui';
import { computed } from 'vue';
import { dayNumber, formatDayLabel, formatNumber, formatWeekday, weekDateKeys } from '@/shared/lib';
import { calendarWeeks, judgeDay } from '../lib/month';

const props = defineProps<{
	month: DateKey;
	today: DateKey;
	totals: Map<DateKey, number>;
	target: number;
	goal: Goal;
}>();

const emit = defineEmits<{
	pick: [date: DateKey];
}>();

const VERDICT_CELL: Record<DayVerdict, string> = {
	empty: 'bg-muted/40',
	onTrack: 'bg-primary/15',
	offTrack: 'bg-destructive/15',
};

const VERDICT_TEXT: Record<DayVerdict, string> = {
	empty: '',
	onTrack: 'text-primary',
	offTrack: 'text-destructive',
};

const VERDICT_LABEL: Record<DayVerdict, string> = {
	empty: '',
	onTrack: 'в норме',
	offTrack: 'вне нормы',
};

const weeks = computed(() => calendarWeeks(props.month));
const weekdays = computed(() => weekDateKeys(props.month).map(formatWeekday));

function kcalOf(date: DateKey): number {
	return props.totals.get(date) ?? 0;
}

function verdictOf(date: DateKey): DayVerdict {
	return judgeDay(kcalOf(date), { target: props.target, goal: props.goal, isToday: date === props.today });
}

function dayLabel(date: DateKey): string {
	const kcal = kcalOf(date);

	return kcal
		? `${formatDayLabel(date)}, ${formatNumber(kcal)} ккал, ${VERDICT_LABEL[verdictOf(date)]}`
		: `${formatDayLabel(date)}, записей нет`;
}
</script>

<template>
	<section>
		<div class="grid grid-cols-7 gap-1" aria-hidden="true">
			<span
				v-for="weekday in weekdays"
				:key="weekday"
				class="pb-1 text-center text-[11px] text-muted-foreground"
			>
				{{ weekday }}
			</span>
		</div>

		<div v-for="(week, index) in weeks" :key="index" class="grid grid-cols-7 gap-1 pt-1">
			<template v-for="(date, slot) in week" :key="date ?? `empty-${slot}`">
				<span v-if="!date" />

				<button
					v-else
					type="button"
					:disabled="date > props.today"
					:aria-label="dayLabel(date)"
					:aria-current="date === props.today ? 'date' : undefined"
					:class="cn(
						'flex h-12 flex-col items-center justify-center rounded-md tabular-nums disabled:opacity-40',
						VERDICT_CELL[verdictOf(date)],
						date === props.today && 'ring-1 ring-foreground/40',
					)"
					@click="emit('pick', date)"
				>
					<span :class="cn('text-sm', date === props.today ? 'font-medium text-foreground' : 'text-muted-foreground')">
						{{ dayNumber(date) }}
					</span>
					<span v-if="kcalOf(date)" :class="cn('text-[10px] leading-tight', VERDICT_TEXT[verdictOf(date)])">
						{{ formatNumber(kcalOf(date)) }}
					</span>
				</button>
			</template>
		</div>
	</section>
</template>
