<script setup lang="ts">
import type { Trend, WeightPoint } from '../lib/impact';
import type { DateKey } from '@/shared/lib';
import { computed } from 'vue';
import { formatDayLabel, formatKg } from '@/shared/lib';

const props = defineProps<{
  points: WeightPoint[];
  trend: Trend | null;
  days: DateKey[];
}>();

const WIDTH = 300;
const HEIGHT = 120;
const PADDING = 8;
const HEADROOM_KG = 0.5;

const lastDay = computed(() => props.days.length - 1);

const trendEnds = computed(() => {
  const trend = props.trend;

  return trend ? [trend.intercept, trend.intercept + trend.slope * lastDay.value] : [];
});

const range = computed(() => {
  const values = [...props.points.map(point => point.kg), ...trendEnds.value];

  return { min: Math.min(...values) - HEADROOM_KG, max: Math.max(...values) + HEADROOM_KG };
});

function x(day: number): number {
  return PADDING + (day / lastDay.value) * (WIDTH - 2 * PADDING);
}

function y(kg: number): number {
  const { min, max } = range.value;

  return PADDING + ((max - kg) / (max - min)) * (HEIGHT - 2 * PADDING);
}
</script>

<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="w-full" role="img" aria-label="Вес за четыре недели">
      <line
        v-if="trendEnds.length"
        :x1="x(0)"
        :y1="y(trendEnds[0])"
        :x2="x(lastDay)"
        :y2="y(trendEnds[1])"
        class="stroke-muted-foreground"
        stroke-width="1.5"
        stroke-dasharray="4 4"
      />
      <circle
        v-for="point in props.points"
        :key="point.day"
        :cx="x(point.day)"
        :cy="y(point.kg)"
        r="3.5"
        class="fill-primary"
      />
    </svg>

    <span class="absolute top-0 left-0 text-[11px] text-muted-foreground tabular-nums">
      {{ formatKg(range.max) }}
    </span>
    <span class="absolute bottom-5 left-0 text-[11px] text-muted-foreground tabular-nums">
      {{ formatKg(range.min) }}
    </span>

    <div class="flex justify-between pt-1 text-[11px] text-muted-foreground">
      <span>{{ formatDayLabel(props.days[0]) }}</span>
      <span>{{ formatDayLabel(props.days[lastDay]) }}</span>
    </div>
  </div>
</template>
