<script setup lang="ts">
import type { ImpactResult } from '../lib/impact';
import { computed } from 'vue';
import { pluralize } from '@/shared/lib';
import { formatKcal, formatRate, SOLID_COVERAGE } from '../lib/impact';

const props = defineProps<{
  result: ImpactResult;
  estimatedTdee: number;
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
  <div v-if="props.result.ready" class="flex flex-col gap-4">
    <dl class="grid grid-cols-2 gap-4">
      <div>
        <dt class="text-xs text-muted-foreground">
          По съеденному ждали
        </dt>
        <dd class="text-lg tabular-nums text-foreground">
          {{ formatRate(props.result.impact.expectedPerWeek) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">
          На самом деле
        </dt>
        <dd class="text-lg tabular-nums text-foreground">
          {{ formatRate(props.result.impact.actualPerWeek) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">
          Реальный расход
        </dt>
        <dd class="text-lg tabular-nums text-foreground">
          ≈ {{ formatKcal(props.result.impact.realTdee) }}
          <span class="text-sm text-muted-foreground">± {{ formatKcal(props.result.impact.realTdeeError) }} ккал</span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">
          По расчёту
        </dt>
        <dd class="text-lg tabular-nums text-foreground">
          {{ formatKcal(props.estimatedTdee) }} ккал
        </dd>
      </div>
    </dl>

    <p class="text-xs text-muted-foreground">
      {{ precisionNote }}
    </p>

    <p v-if="props.result.impact.coverage < SOLID_COVERAGE" class="text-xs text-warning">
      Еда записана меньше чем за 70 % дней. Недописанные дни занижают съеденное, и расход выходит ниже настоящего.
    </p>

    <p class="text-xs text-muted-foreground">
      Вес за день гуляет на ±0,7 кг из-за воды и еды. Чем чаще взвешивания, тем точнее расход.
    </p>
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
