<script setup lang="ts">
import type { Entry, Profile } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { entriesFrom, totalsByDate } from '@/entities/entry';
import { loadProfile } from '@/entities/profile';
import { formatNumber, lastDateKeys, pluralize, useLiveQuery } from '@/shared/lib';
import { formatDeviation, summarizeWeek, weekTotals } from './lib/week';
import WeekChart from './ui/WeekChart.vue';

const WINDOW_DAYS = 7;

const router = useRouter();

const days = lastDateKeys(WINDOW_DAYS);

const entries = useLiveQuery<Entry[]>(() => entriesFrom(days[0]), []);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);

const target = computed(() => profile.value?.targetKcal ?? 0);
const dayTotals = computed(() => weekTotals(days, totalsByDate(entries.value)));
const summary = computed(() => summarizeWeek(dayTotals.value, target.value));

const trackedLabel = computed(() => {
  const { trackedDays } = summary.value;

  return `${trackedDays} ${pluralize(trackedDays, ['день', 'дня', 'дней'])} с записями`;
});

function showDay(date: DateKey) {
  void router.push({ path: '/', query: { date } });
}
</script>

<template>
  <main class="flex-1 px-4 pt-6 pb-6">
    <h1 class="text-xl font-semibold text-text-primary">
      Неделя
    </h1>

    <div class="pt-6">
      <WeekChart :days="dayTotals" :target="target" @pick="showDay" />
    </div>

    <template v-if="summary.trackedDays">
      <dl class="grid grid-cols-2 gap-4 pt-8">
        <div>
          <dt class="text-xs text-text-tertiary">
            В среднем за день
          </dt>
          <dd class="text-lg tabular-nums text-text-primary">
            {{ formatNumber(summary.average) }} ккал
          </dd>
        </div>
        <div>
          <dt class="text-xs text-text-tertiary">
            Всего за неделю
          </dt>
          <dd class="text-lg tabular-nums text-text-primary">
            {{ formatNumber(summary.total) }} ккал
          </dd>
        </div>
      </dl>

      <p class="pt-4 text-sm text-text-secondary">
        Против цели за {{ trackedLabel }}: {{ formatDeviation(summary.deviation) }}
      </p>
    </template>

    <p v-else class="pt-8 text-center text-sm text-text-secondary">
      За эту неделю записей пока нет
    </p>
  </main>
</template>
