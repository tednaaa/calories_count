<script setup lang="ts">
import type { DayTotal } from '../lib/week';
import type { DateKey } from '@/shared/lib';
import { cn } from 'shonk-ui';
import { computed } from 'vue';
import { formatDayLabel, formatNumber, formatWeekday, isToday } from '@/shared/lib';
import { chartScale } from '../lib/week';

const props = defineProps<{
  days: DayTotal[];
  target: number;
}>();

const emit = defineEmits<{
  pick: [date: DateKey];
}>();

const scale = computed(() => chartScale(props.days, props.target));

function heightPercent(kcal: number): string {
  return `${(kcal / scale.value) * 100}%`;
}
</script>

<template>
  <section>
    <div class="relative flex h-44 gap-1.5">
      <div
        v-if="props.target > 0"
        class="pointer-events-none absolute inset-x-0 border-t border-dashed border-border-strong"
        :style="{ bottom: heightPercent(props.target) }"
      />

      <button
        v-for="day in props.days"
        :key="day.date"
        type="button"
        class="relative flex-1 rounded-t-sm bg-bg-muted/40"
        :aria-label="`${formatDayLabel(day.date)}, ${formatNumber(day.kcal)} ккал`"
        @click="emit('pick', day.date)"
      >
        <span
          :class="cn(
            'absolute inset-x-0 bottom-0 rounded-t-sm',
            day.kcal > props.target ? 'bg-bg-danger' : 'bg-bg-brand',
          )"
          :style="{ height: heightPercent(day.kcal) }"
        />
      </button>
    </div>

    <div class="mt-2 flex gap-1.5" aria-hidden="true">
      <span
        v-for="day in props.days"
        :key="day.date"
        :class="cn(
          'flex-1 text-center text-[11px]',
          isToday(day.date) ? 'font-medium text-text-primary' : 'text-text-tertiary',
        )"
      >
        {{ formatWeekday(day.date) }}
      </span>
    </div>
  </section>
</template>
