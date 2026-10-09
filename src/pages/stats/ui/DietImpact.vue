<script setup lang="ts">
import type { ImpactResult } from '../lib/impact';
import { computed } from 'vue';
import { pluralize } from '@/shared/lib';
import { formatKcal, formatRate, SOLID_COVERAGE } from '../lib/impact';

const props = defineProps<{
	result: ImpactResult;
	estimatedTdee: number;
	reminds: boolean;
}>();

const precisionNote = computed(() => {
	if (!props.result.ready) {
		return '';
	}

	const { weighIns, projection, trackedDays, countedDays } = props.result.impact;
	const basis = `По ${weighIns} ${pluralize(weighIns, ['взвешиванию', 'взвешиваниям', 'взвешиваниям'])}`;
	const better = projection ? `; при ${projection.weighIns} будет ± ${formatKcal(projection.error)} ккал` : '';
	const food = `Еда записана за ${trackedDays} из ${countedDays} ${pluralize(countedDays, ['дня', 'дней', 'дней'])}`;

	return `${basis}${better}. ${food}.`;
});
</script>

<template>
	<div v-if="props.result.ready" class="flex flex-col gap-3">
		<div>
			<p class="text-2xl font-semibold tabular-nums text-foreground">
				≈ {{ formatKcal(props.result.impact.realTdee) }}
				<span class="text-sm font-normal text-muted-foreground">± {{ formatKcal(props.result.impact.realTdeeError) }} ккал</span>
			</p>
			<p class="text-sm text-muted-foreground">
				В день. По формуле — {{ formatKcal(props.estimatedTdee) }} ккал.
			</p>
		</div>

		<p v-if="props.result.impact.coverage < SOLID_COVERAGE" class="text-xs text-warning">
			Еда записана меньше чем за 70 % дней. Недописанные дни занижают съеденное, и расход выходит ниже настоящего.
		</p>

		<details class="text-xs text-muted-foreground">
			<summary class="cursor-pointer text-foreground">
				Подробнее
			</summary>
			<div class="flex flex-col gap-3 pt-3">
				<dl class="grid grid-cols-2 gap-4">
					<div>
						<dt>По съеденному ждали</dt>
						<dd class="text-base tabular-nums text-foreground">
							{{ formatRate(props.result.impact.expectedPerWeek) }}
						</dd>
					</div>
					<div>
						<dt>На самом деле</dt>
						<dd class="text-base tabular-nums text-foreground">
							{{ formatRate(props.result.impact.actualPerWeek) }}
						</dd>
					</div>
				</dl>

				<p>{{ precisionNote }}</p>
				<p>Вес за день гуляет на ±0,7 кг из-за воды и еды. Чем чаще взвешивания, тем точнее расход.</p>
				<p v-if="props.reminds">
					Приложение напомнит, если вы не взвешивались 2 дня, — этого хватает для точности ± 200 ккал.
				</p>
			</div>
		</details>
	</div>

	<div v-else class="flex flex-col gap-2 text-sm text-muted-foreground">
		<p>Чтобы увидеть, как питание влияет на вес, нужно ещё:</p>
		<ul class="list-disc pl-5">
			<li v-if="props.result.shortfall.weighIns">
				{{ props.result.shortfall.weighIns }} {{ pluralize(props.result.shortfall.weighIns, ['взвешивание', 'взвешивания', 'взвешиваний']) }}
			</li>
			<li v-if="props.result.shortfall.spanDays">
				{{ props.result.shortfall.spanDays }} {{ pluralize(props.result.shortfall.spanDays, ['день', 'дня', 'дней']) }} между первым и последним взвешиванием
			</li>
			<li v-if="props.result.shortfall.trackedDays">
				{{ props.result.shortfall.trackedDays }} {{ pluralize(props.result.shortfall.trackedDays, ['день', 'дня', 'дней']) }} с записями еды
			</li>
		</ul>
	</div>
</template>
