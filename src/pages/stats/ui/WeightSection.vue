<script setup lang="ts">
import type { Entry, Profile, WeightRecord } from '@/shared/db';
import { Button } from 'shonk-ui';
import { computed, ref } from 'vue';
import { entriesFrom, totalsByDate } from '@/entities/entry';
import { calcTdee, loadProfile } from '@/entities/profile';
import { lastWeight, weightsFrom } from '@/entities/weight';
import { formatDayLabel, formatKg, lastDateKeys, useLiveQuery, useToday } from '@/shared/lib';
import { WeighInDialog } from '@/widgets/weigh-in';
import { analyzeImpact, fitTrend, IMPACT_WINDOW_DAYS, toPoints } from '../lib/impact';
import DietImpact from './DietImpact.vue';
import WeightChart from './WeightChart.vue';

const today = useToday();
const days = computed(() => lastDateKeys(IMPACT_WINDOW_DAYS, today.value));

const latest = useLiveQuery<WeightRecord | undefined>(() => lastWeight(), undefined);
const weights = useLiveQuery<WeightRecord[]>(() => weightsFrom(days.value[0]), [], [days]);
const entries = useLiveQuery<Entry[]>(() => entriesFrom(days.value[0]), [], [days]);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);

const points = computed(() => toPoints(weights.value, days.value));
const trend = computed(() => fitTrend(points.value));
const formulaTdee = computed(() => (profile.value ? calcTdee(profile.value) : 0));

const impact = computed(() => analyzeImpact({
  days: days.value,
  totals: totalsByDate(entries.value),
  weights: weights.value,
  formulaTdee: formulaTdee.value,
}));

const weighing = ref(false);
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold text-foreground">
      Вес
    </h2>

    <div class="flex items-end justify-between gap-4 pt-4">
      <div v-if="latest">
        <p class="text-lg tabular-nums text-foreground">
          {{ formatKg(latest.kg) }} кг
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatDayLabel(latest.date) }}
        </p>
      </div>
      <p v-else class="text-sm text-muted-foreground">
        Взвешиваний пока нет
      </p>

      <Button type="button" @click="weighing = true">
        Записать вес
      </Button>
    </div>

    <WeightChart
      v-if="points.length"
      :points="points"
      :trend="trend"
      :window-days="IMPACT_WINDOW_DAYS"
      class="mt-6"
    />

    <h3 class="pt-8 pb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      Как питание влияет на вес
    </h3>
    <DietImpact v-if="profile" :result="impact" :formula-tdee="formulaTdee" />

    <WeighInDialog v-model:open="weighing" :last-kg="latest?.kg" />
  </section>
</template>
