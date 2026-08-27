<script setup lang="ts">
import type { DateKey } from '@/shared/lib';
import { useEventListener, useSwipe } from '@vueuse/core';
import { cn } from 'shonk-ui';
import { computed, onMounted, useTemplateRef, watch } from 'vue';
import {
  dayNumber,
  formatFullDate,
  formatWeekday,
  isFuture,
  isToday,
  shiftDateKey,
  startOfWeek,
  toDateKey,
  weekDateKeys,
} from '@/shared/lib';

const props = defineProps<{ gestureArea?: HTMLElement | null }>();

const selected = defineModel<DateKey>({ required: true });

const HISTORY_WEEKS = 26;
const WHEEL_STEP_DELAY = 400;

const weeks = computed(() => {
  const selectedWeek = startOfWeek(selected.value);
  const result: DateKey[][] = [];

  for (
    let week = startOfWeek(toDateKey());
    week >= selectedWeek || result.length < HISTORY_WEEKS;
    week = shiftDateKey(week, -7)
  ) {
    result.unshift(weekDateKeys(week));
  }

  return result;
});

const selectedWeekIndex = computed(() => weeks.value.findIndex(week => week.includes(selected.value)));

const strip = useTemplateRef<HTMLElement>('strip');

function showSelectedWeek(behavior: ScrollBehavior) {
  const element = strip.value;

  if (element) {
    element.scrollTo({ left: selectedWeekIndex.value * element.clientWidth, behavior });
  }
}

function shiftSelectedDay(step: number) {
  const shifted = shiftDateKey(selected.value, step);

  selected.value = isFuture(shifted) ? toDateKey() : shifted;
}

let lastWheelStep = Number.NEGATIVE_INFINITY;

function stepByWheel(event: WheelEvent) {
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const settled = event.timeStamp - lastWheelStep >= WHEEL_STEP_DELAY;

  if (delta !== 0 && settled) {
    lastWheelStep = event.timeStamp;
    shiftSelectedDay(Math.sign(delta));
  }
}

useEventListener(() => props.gestureArea, 'wheel', stepByWheel);

useSwipe(() => props.gestureArea, {
  onSwipeEnd(_, direction) {
    if (direction === 'left' || direction === 'right') {
      shiftSelectedDay(direction === 'left' ? 1 : -1);
    }
  },
});

onMounted(() => {
  showSelectedWeek('instant');
});

watch(selected, () => {
  showSelectedWeek('smooth');
}, { flush: 'post' });

function dayStyle(day: DateKey) {
  if (day === selected.value) {
    return 'border-border-brand bg-bg-brand-subtle font-semibold text-text-brand';
  }
  if (isToday(day)) {
    return 'border-border-strong text-text-primary';
  }

  return 'border-border-default text-text-secondary';
}
</script>

<template>
  <div
    ref="strip"
    role="group"
    aria-label="Выбор дня"
    class="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
  >
    <div v-for="week in weeks" :key="week[0]" class="grid w-full shrink-0 snap-center grid-cols-7 px-2">
      <button
        v-for="day in week"
        :key="day"
        type="button"
        :disabled="isFuture(day)"
        :aria-label="formatFullDate(day)"
        :aria-current="day === selected ? 'date' : undefined"
        class="flex flex-col items-center gap-1 py-1 disabled:opacity-30"
        @click="selected = day"
      >
        <span
          :class="cn(
            'text-[11px] whitespace-nowrap capitalize',
            day === selected ? 'text-text-primary' : 'text-text-tertiary',
          )"
        >
          {{ isToday(day) ? 'Сегодня' : formatWeekday(day) }}
        </span>

        <span :class="cn('flex size-9 items-center justify-center rounded-full border text-sm', dayStyle(day))">
          {{ dayNumber(day) }}
        </span>
      </button>
    </div>
  </div>
</template>
