<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/shared/lib';

const props = defineProps<{
  eaten: number;
  target: number;
}>();

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ratio = computed(() => (props.target > 0 ? props.eaten / props.target : 0));
const filled = computed(() => Math.min(ratio.value, 1));
const overflow = computed(() => Math.min(Math.max(ratio.value - 1, 0), 1));
const remaining = computed(() => props.target - props.eaten);
const isOver = computed(() => remaining.value < 0);
</script>

<template>
  <section class="flex flex-col items-center gap-4">
    <div class="relative">
      <svg viewBox="0 0 120 120" class="size-44 -rotate-90">
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
        <span class="text-3xl font-semibold tabular-nums text-text-primary">{{ formatNumber(eaten) }}</span>
        <span class="text-xs text-text-tertiary">из {{ formatNumber(target) }} ккал</span>
      </div>
    </div>

    <dl class="grid w-full grid-cols-3 gap-2 text-center">
      <div>
        <dt class="text-xs text-text-tertiary">
          Съедено
        </dt>
        <dd class="text-sm tabular-nums text-text-primary">
          {{ formatNumber(eaten) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-text-tertiary">
          {{ isOver ? 'Перебор' : 'Осталось' }}
        </dt>
        <dd :class="isOver ? 'text-sm tabular-nums text-text-danger' : 'text-sm tabular-nums text-text-primary'">
          {{ formatNumber(Math.abs(remaining)) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-text-tertiary">
          Цель
        </dt>
        <dd class="text-sm tabular-nums text-text-primary">
          {{ formatNumber(target) }}
        </dd>
      </div>
    </dl>
  </section>
</template>
