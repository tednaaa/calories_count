import type { Goal } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { isGainingGoal } from '@/entities/profile';
import { formatNumber, fromDateKey, shiftDateKey, startOfWeek, toDateKey, weekDateKeys } from '@/shared/lib';
import { KCAL_PER_KG } from './impact';

export interface DayTotal {
	date: DateKey;
	kcal: number;
}

export interface PeriodSummary {
	total: number;
	average: number;
	trackedDays: number;
	deviation: number;
}

export type CalendarWeek = (DateKey | null)[];

export type DayVerdict = 'empty' | 'onTrack' | 'offTrack';

export interface DayContext {
	target: number;
	goal: Goal;
	isToday: boolean;
}

export const DEVIATION_MIN_DAYS = 7;

const TARGET_TOLERANCE = 0.05;

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function startOfMonth(key: DateKey): DateKey {
	return `${key.slice(0, 7)}-01`;
}

export function shiftMonth(first: DateKey, months: number): DateKey {
	const date = fromDateKey(first);

	return toDateKey(new Date(date.getFullYear(), date.getMonth() + months, 1));
}

export function endOfMonth(first: DateKey): DateKey {
	return shiftDateKey(shiftMonth(first, 1), -1);
}

export function requestedMonth(value: unknown, today: DateKey = toDateKey()): DateKey {
	const current = startOfMonth(today);

	if (typeof value !== 'string' || !MONTH_KEY_PATTERN.test(value)) {
		return current;
	}

	const first = `${value}-01`;

	return toDateKey(fromDateKey(first)) === first && first <= current ? first : current;
}

export function monthDateKeys(first: DateKey): DateKey[] {
	const last = endOfMonth(first);
	const days: DateKey[] = [];

	for (let day = first; day <= last; day = shiftDateKey(day, 1)) {
		days.push(day);
	}

	return days;
}

export function calendarWeeks(first: DateKey): CalendarWeek[] {
	const last = endOfMonth(first);
	const weeks: CalendarWeek[] = [];

	for (let monday = startOfWeek(first); monday <= last; monday = shiftDateKey(monday, 7)) {
		weeks.push(weekDateKeys(monday).map(date => (startOfMonth(date) === first ? date : null)));
	}

	return weeks;
}

export function judgeDay(kcal: number, { target, goal, isToday }: DayContext): DayVerdict {
	if (!kcal) {
		return 'empty';
	}

	const slack = target * TARGET_TOLERANCE;

	if (isGainingGoal(goal)) {
		return !isToday && kcal < target - slack ? 'offTrack' : 'onTrack';
	}

	return target > 0 && kcal > target + slack ? 'offTrack' : 'onTrack';
}

export function dayTotals(days: DateKey[], totals: Map<DateKey, number>): DayTotal[] {
	return days.map(date => ({ date, kcal: totals.get(date) ?? 0 }));
}

export function summarizeDays(days: DayTotal[], target: number): PeriodSummary {
	const tracked = days.filter(day => day.kcal > 0);
	const total = tracked.reduce((sum, day) => sum + day.kcal, 0);

	return {
		total,
		trackedDays: tracked.length,
		average: tracked.length ? Math.round(total / tracked.length) : 0,
		deviation: total - target * tracked.length,
	};
}

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });

export function formatMonth(first: DateKey): string {
	const date = fromDateKey(first);
	const month = monthFormatter.format(date);

	return `${month[0].toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

export function formatDeviation(deviation: number): string {
	if (deviation === 0) {
		return 'ровно по цели';
	}

	const kilograms = (Math.abs(deviation) / KCAL_PER_KG).toFixed(2).replace('.', ',');
	const direction = deviation < 0 ? 'дефицит' : 'профицит';

	return `${direction} ${formatNumber(Math.abs(deviation))} ккал ≈ ${kilograms} кг`;
}
