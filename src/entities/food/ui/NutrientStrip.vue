<script setup lang="ts">
import type { NutrientId } from '../lib/nutrients';
import type { Grades, Nutrients, NutriScore } from '@/shared/db';
import { cn } from 'shonk-ui';
import { computed } from 'vue';
import { formatNutrient, nutrientNames } from '../lib/nutrients';

const props = defineProps<{ nutrients?: Nutrients; grades?: Grades }>();

const scoreColors: Record<NutriScore, string> = {
  a: 'bg-green-700',
  b: 'bg-lime-600',
  c: 'bg-yellow-500',
  d: 'bg-orange-500',
  e: 'bg-red-600',
};

const novaNames: Record<number, string> = {
  1: 'почти не обработано',
  2: 'кулинарный ингредиент',
  3: 'обработанное',
  4: 'ультра-обработанное',
};

const measured = computed(() => {
  const nutrients = props.nutrients ?? {};

  return (Object.keys(nutrientNames) as NutrientId[])
    .filter(id => nutrients[id] !== undefined)
    .map(id => ({ id, name: nutrientNames[id], value: formatNutrient(nutrients[id]!) }));
});

const score = computed(() => props.grades?.nutriScore);
const nova = computed(() => props.grades?.nova);
</script>

<template>
  <div v-if="measured.length || score || nova" class="flex flex-col gap-3 rounded-lg bg-muted p-3">
    <div v-if="score || nova" class="flex items-center gap-2">
      <span
        v-if="score"
        :class="cn('flex size-6 items-center justify-center rounded text-xs font-semibold text-white uppercase', scoreColors[score])"
      >
        {{ score }}
      </span>

      <span v-if="nova" class="text-xs text-muted-foreground">
        NOVA {{ nova }} · {{ novaNames[nova] }}
      </span>
    </div>

    <dl v-if="measured.length" class="grid grid-cols-2 gap-x-4 gap-y-1">
      <div v-for="item in measured" :key="item.id" class="flex items-baseline justify-between gap-2 text-xs">
        <dt class="text-muted-foreground">
          {{ item.name }}
        </dt>
        <dd class="tabular-nums text-foreground">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>
