<script setup lang="ts">
import type { Entry, Profile } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { Button } from 'shonk-ui';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { entriesBetween, totalsByDate } from '@/entities/entry';
import { loadProfile } from '@/entities/profile';
import { formatNumber, pluralize, useLiveQuery, useToday } from '@/shared/lib';
import { dayTotals, endOfMonth, formatDeviation, formatMonth, monthDateKeys, requestedMonth, shiftMonth, startOfMonth, summarizeDays } from './lib/month';
import MonthCalendar from './ui/MonthCalendar.vue';
import WeightSection from './ui/WeightSection.vue';

const route = useRoute();
const router = useRouter();

const today = useToday();
const month = computed(() => requestedMonth(route.query.month, today.value));
const isCurrentMonth = computed(() => month.value === startOfMonth(today.value));

const entries = useLiveQuery<Entry[]>(() => entriesBetween(month.value, endOfMonth(month.value)), [], [month]);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);

const target = computed(() => profile.value?.targetKcal ?? 0);
const goal = computed(() => profile.value?.goal ?? 'maintain');
const totals = computed(() => totalsByDate(entries.value));
const summary = computed(() => summarizeDays(dayTotals(monthDateKeys(month.value), totals.value), target.value));

const trackedLabel = computed(() => {
  const { trackedDays } = summary.value;

  return `${trackedDays} ${pluralize(trackedDays, ['день', 'дня', 'дней'])} с записями`;
});

function showMonth(months: number) {
  const next = shiftMonth(month.value, months);
  const query = next === startOfMonth(today.value) ? {} : { month: next.slice(0, 7) };

  void router.replace({ query });
}

function showDay(date: DateKey) {
  void router.push({ path: '/', query: { date } });
}
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-6">
    <h1 class="text-xl font-semibold text-foreground">
      Статистика
    </h1>

    <div class="flex items-center justify-between pt-4">
      <Button variant="ghost" size="icon" aria-label="Предыдущий месяц" @click="showMonth(-1)">
        <ChevronLeftIcon class="size-5" />
      </Button>
      <h2 class="text-base font-medium text-foreground">
        {{ formatMonth(month) }}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Следующий месяц"
        :disabled="isCurrentMonth"
        @click="showMonth(1)"
      >
        <ChevronRightIcon class="size-5" />
      </Button>
    </div>

    <MonthCalendar
      class="pt-2"
      :month="month"
      :today="today"
      :totals="totals"
      :target="target"
      :goal="goal"
      @pick="showDay"
    />

    <template v-if="summary.trackedDays">
      <dl class="grid grid-cols-2 gap-4 pt-8">
        <div>
          <dt class="text-xs text-muted-foreground">
            В среднем за день
          </dt>
          <dd class="text-lg tabular-nums text-foreground">
            {{ formatNumber(summary.average) }} ккал
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">
            Всего за месяц
          </dt>
          <dd class="text-lg tabular-nums text-foreground">
            {{ formatNumber(summary.total) }} ккал
          </dd>
        </div>
      </dl>

      <p class="pt-4 text-sm text-muted-foreground">
        Против цели за {{ trackedLabel }}: {{ formatDeviation(summary.deviation) }}
      </p>
    </template>

    <p v-else class="pt-8 text-center text-sm text-muted-foreground">
      За этот месяц записей нет
    </p>

    <WeightSection class="pt-10" />
  </main>
</template>
