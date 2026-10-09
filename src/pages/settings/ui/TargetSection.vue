<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { Button, Input, toast } from 'shonk-ui';
import { computed, ref, watch } from 'vue';
import { calcTarget, GOAL_FACTOR, goalOptions, resetCalibration, resetTargetToCalculated, setManualTarget } from '@/entities/profile';
import { formatNumber } from '@/shared/lib';

const props = defineProps<{ profile: Profile }>();
const MIN_TARGET = 800;
const MAX_TARGET = 6000;

const manual = ref(String(props.profile.targetKcal));
const editing = ref(false);

watch(() => props.profile.targetKcal, (next) => {
	manual.value = String(next);
});

const breakdown = computed(() => calcTarget(props.profile));
const calculated = computed(() => breakdown.value.target);

function roundedKcal(kcal: number): string {
	return `${formatNumber(Math.round(kcal / 10) * 10)} ккал`;
}

const goalStep = computed(() => {
	const name = goalOptions.find(option => option.id === props.profile.goal)?.name;
	const percent = Math.round((GOAL_FACTOR[props.profile.goal] - 1) * 100);

	return { name, change: percent === 0 ? 'без поправки' : `${percent > 0 ? '+' : '−'}${Math.abs(percent)} %` };
});

const origin = computed(() => {
	if (props.profile.targetOverridden) {
		return 'Задана вручную';
	}

	return props.profile.calibratedAt ? 'Посчитана по профилю и уточнена по весу' : 'Посчитана по профилю';
});

const correctionNote = computed(() => {
	const correction = props.profile.tdeeCorrectionKcal ?? 0;
	const direction = correction < 0 ? 'ниже' : 'выше';

	return `Ваш расход по весу на ${formatNumber(Math.abs(correction))} ккал ${direction} формулы, это учтено в расчёте.`;
});

const entered = computed(() => {
	const value = Number(manual.value);

	return Number.isInteger(value) && value >= MIN_TARGET && value <= MAX_TARGET ? value : null;
});

const changed = computed(() => entered.value !== null && entered.value !== props.profile.targetKcal);

async function apply() {
	if (entered.value === null) {
		return;
	}

	await setManualTarget(entered.value);
	editing.value = false;
	toast('Норма задана вручную');
}

async function forgetCalibration() {
	await resetCalibration();
	toast('Уточнение сброшено');
}

async function reset() {
	await resetTargetToCalculated();
	toast('Вернули расчётную норму');
}
</script>

<template>
	<div class="flex flex-col gap-3">
		<p class="text-3xl font-semibold tabular-nums text-foreground">
			{{ formatNumber(props.profile.targetKcal) }}
			<span class="text-base font-normal text-muted-foreground">ккал в день</span>
		</p>

		<p class="text-sm text-muted-foreground">
			{{ origin }}
		</p>

		<p v-if="props.profile.calibratedAt" class="text-sm text-muted-foreground">
			{{ correctionNote }}
		</p>

		<dl class="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					Обмен в покое
				</dt>
				<dd class="tabular-nums text-foreground">
					{{ roundedKcal(breakdown.bmr) }}
				</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					Расход с активностью
				</dt>
				<dd class="tabular-nums text-foreground">
					{{ roundedKcal(breakdown.tdee) }}
				</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					{{ goalStep.name }}
				</dt>
				<dd class="tabular-nums text-foreground">
					{{ goalStep.change }}
				</dd>
			</div>
			<div class="flex justify-between gap-4 border-t border-border pt-2">
				<dt class="text-muted-foreground">
					{{ breakdown.clampedToMinimum ? 'Поднята до безопасного минимума' : 'По профилю' }}
				</dt>
				<dd class="tabular-nums text-foreground">
					{{ formatNumber(calculated) }} ккал
				</dd>
			</div>
		</dl>

		<template v-if="editing">
			<div class="flex items-end gap-2 pt-3">
				<Input id="target" v-model="manual" inputmode="numeric" :invalid="entered === null" class="flex-1" />
				<Button type="button" :disabled="!changed" @click="apply">
					Задать
				</Button>
			</div>

			<p v-if="entered === null" class="text-xs text-warning">
				Норма должна быть целым числом от {{ formatNumber(MIN_TARGET) }} до {{ formatNumber(MAX_TARGET) }} ккал.
			</p>
		</template>

		<Button
			v-else
			type="button"
			variant="secondary"
			class="mt-3"
			@click="editing = true"
		>
			Задать вручную
		</Button>

		<Button
			v-if="props.profile.targetOverridden"
			type="button"
			variant="secondary"
			@click="reset"
		>
			Вернуть расчётную
		</Button>

		<Button
			v-if="props.profile.calibratedAt"
			type="button"
			variant="secondary"
			@click="forgetCalibration"
		>
			Сбросить уточнение
		</Button>
	</div>
</template>
