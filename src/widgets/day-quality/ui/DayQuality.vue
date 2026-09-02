<script setup lang="ts">
import type { Nutrients } from '@/shared/db';
import { cn } from 'shonk-ui';
import { computed } from 'vue';
import {
  formatNutrient,
  meetsTarget,
  nutrientNames,
  nutrientTargets,
  plainNutrients,
  targetRatio,
} from '@/entities/food';
import { pluralize } from '@/shared/lib';

const props = defineProps<{
  nutrients?: Nutrients;
  measured: number;
  entries: number;
  weightKg: number;
  targetKcal: number;
}>();

const eaten = computed(() => props.nutrients ?? {});

type Tone = 'done' | 'going' | 'over';

const barTones: Record<Tone, string> = { done: 'bg-success', going: 'bg-primary', over: 'bg-destructive' };

const tracked = computed(() => nutrientTargets(props.weightKg, props.targetKcal).map((target) => {
  const amount = eaten.value[target.id] ?? 0;
  const met = meetsTarget(amount, target);
  const tone: Tone = target.goal === 'reach' ? (met ? 'done' : 'going') : (met ? 'going' : 'over');

  return {
    ...target,
    tone,
    fill: Math.min(targetRatio(amount, target), 1),
    text: `${formatNutrient(amount).replace(' г', '')} / ${target.amount} г`,
  };
}));

const rest = computed(() => plainNutrients
  .filter(id => eaten.value[id] !== undefined)
  .map(id => `${nutrientNames[id]} ${formatNutrient(eaten.value[id]!)}`)
  .join(' · '));

const coverage = computed(() => {
  const records = pluralize(props.measured, ['записи', 'записей', 'записей']);

  return `по ${props.measured} ${records} из ${props.entries}`;
});
</script>

<template>
  <section v-if="props.nutrients" class="flex flex-col gap-3">
    <header class="flex items-baseline justify-between gap-2">
      <h2 class="text-xs text-muted-foreground">
        Кроме калорий
      </h2>
      <span class="text-xs text-muted-foreground">{{ coverage }}</span>
    </header>

    <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
      <li v-for="target in tracked" :key="target.id" class="flex flex-col gap-1">
        <div class="flex items-baseline justify-between gap-2 text-xs">
          <span class="text-muted-foreground">{{ target.name }}</span>
          <span :class="cn('tabular-nums', target.tone === 'over' ? 'text-destructive' : 'text-foreground')">
            {{ target.text }}
          </span>
        </div>

        <div class="h-1 overflow-hidden rounded-full bg-muted">
          <div
            :class="cn('h-full rounded-full transition-[width] duration-300', barTones[target.tone])"
            :style="{ width: `${target.fill * 100}%` }"
          />
        </div>
      </li>
    </ul>

    <p v-if="rest" class="text-xs text-muted-foreground">
      {{ rest }}
    </p>
  </section>

  <p v-else-if="props.entries" class="text-xs text-muted-foreground">
    Состав дня появится, когда добавишь продукт по штрих-коду.
  </p>
</template>
