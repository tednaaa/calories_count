<script setup lang="ts">
import { cn } from 'shonk-ui';
import { computed } from 'vue';
import { formatNumber } from '@/shared/lib';

const props = defineProps<{
  eaten: number;
  target: number;
  compact?: boolean;
}>();

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ratio = computed(() => (props.target > 0 ? props.eaten / props.target : 0));
const filled = computed(() => Math.min(ratio.value, 1));
const overflow = computed(() => Math.min(Math.max(ratio.value - 1, 0), 1));
const remaining = computed(() => props.target - props.eaten);
const isOver = computed(() => remaining.value < 0);

const stats = computed(() => [
  { label: 'Съедено', value: props.eaten, over: false },
  { label: isOver.value ? 'Перебор' : 'Осталось', value: Math.abs(remaining.value), over: isOver.value },
  { label: 'Цель', value: props.target, over: false },
]);
</script>

<template>
  <section :class="cn('flex transition-all duration-300', props.compact ? 'items-center gap-5' : 'flex-col items-center gap-4')">
    <div class="relative shrink-0">
      <svg viewBox="0 0 120 120" :class="cn('-rotate-90 transition-all duration-300', props.compact ? 'size-24' : 'size-44')">
        <circle
          cx="60"
          cy="60"
          :r="RADIUS"
          fill="none"
          stroke-width="10"
          class="stroke-bg-muted"
        />
        <circle
          cx="60"
          cy="60"
          :r="RADIUS"
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="CIRCUMFERENCE * (1 - filled)"
          class="stroke-bg-brand transition-[stroke-dashoffset] duration-300"
        />
        <circle
          v-if="overflow > 0"
          cx="60"
          cy="60"
          :r="RADIUS"
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="CIRCUMFERENCE * (1 - overflow)"
          class="stroke-bg-danger transition-[stroke-dashoffset] duration-300"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span :class="cn('font-semibold tabular-nums text-text-primary transition-all duration-300', props.compact ? 'text-lg' : 'text-3xl')">
          {{ formatNumber(eaten) }}
        </span>
        <span v-if="!props.compact" class="text-xs text-text-tertiary">из {{ formatNumber(target) }} ккал</span>
      </div>
    </div>

    <dl :class="cn('transition-all duration-300', props.compact ? 'flex min-w-0 flex-1 flex-col gap-1.5' : 'grid w-full grid-cols-3 gap-2 text-center')">
      <div v-for="stat in stats" :key="stat.label" :class="cn(props.compact && 'flex items-baseline justify-between gap-3')">
        <dt class="text-xs text-text-tertiary">
          {{ stat.label }}
        </dt>
        <dd :class="cn('text-sm tabular-nums', stat.over ? 'text-text-danger' : 'text-text-primary')">
          {{ formatNumber(stat.value) }}
        </dd>
      </div>
    </dl>
  </section>
</template>
