<script setup lang="ts">
import type { Entry, Profile } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { Button, cn, toast, useConfirm } from 'shonk-ui';
import { computed, ref, useTemplateRef } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  countMeasured,
  entriesOfDay,
  EntryRow,
  removeEntry,
  restoreEntry,
  totalKcal,
  totalNutrients,
} from '@/entities/entry';
import { photosById, useCustomFoods } from '@/entities/food';
import { loadProfile } from '@/entities/profile';
import { isToday, requestedDateKey, useLiveQuery } from '@/shared/lib';
import { DayProgress } from '@/widgets/day-progress';
import { DayQuality } from '@/widgets/day-quality';
import { WeekStrip } from '@/widgets/week-strip';
import { nextCompact } from './compact';

const route = useRoute();
const router = useRouter();
const confirmation = useConfirm();

const dateKey = computed({
  get: () => requestedDateKey(route.query.date),
  set: (date: DateKey) => {
    void router.replace({ query: { date } });
  },
});

const entries = useLiveQuery<Entry[]>(() => entriesOfDay(dateKey.value), [], [dateKey]);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
const customFoods = useCustomFoods();

const customPhotos = computed(() => photosById(customFoods.value));

const eaten = computed(() => totalKcal(entries.value));
const target = computed(() => profile.value?.targetKcal ?? 0);
const weight = computed(() => profile.value?.weightKg ?? 0);
const nutrients = computed(() => totalNutrients(entries.value));
const measured = computed(() => countMeasured(entries.value));
const showsToday = computed(() => isToday(dateKey.value));
const addLink = computed(() => (showsToday.value ? '/add' : `/add?date=${dateKey.value}`));

const summary = useTemplateRef<HTMLElement>('summary');
const compact = ref(false);

function trackScroll(event: Event) {
  const list = event.target as HTMLElement;

  compact.value = nextCompact(compact.value, {
    scrollTop: list.scrollTop,
    scrollable: list.scrollHeight - list.clientHeight,
    headerHeight: summary.value?.offsetHeight ?? 0,
  });
}

async function remove(entry: Entry) {
  await removeEntry(entry.id);

  toast('Запись удалена', {
    action: {
      label: 'Вернуть',
      onClick: () => {
        void restoreEntry(entry);
      },
    },
  });
}

function askToRemove(entry: Entry) {
  confirmation.require({
    message: `«${entry.name}» пропадёт из дневника за этот день.`,
    acceptButtonText: 'Удалить',
    accept: () => {
      void remove(entry);
    },
  });
}

function editEntry(entry: Entry) {
  void router.push(`/entry/${entry.id}`);
}
</script>

<template>
  <main class="flex min-h-0 flex-1 flex-col">
    <WeekStrip v-model="dateKey" :gesture-area="summary" class="shrink-0 pt-6 pb-2" />

    <div
      ref="summary"
      :class="cn('shrink-0 border-b border-border px-4 transition-all duration-300', compact ? 'py-3' : 'py-6')"
    >
      <DayProgress :eaten="eaten" :target="target" :compact="compact" />

      <DayQuality
        v-if="!compact && entries.length"
        :nutrients="nutrients"
        :measured="measured"
        :entries="entries.length"
        :weight-kg="weight"
        :target-kcal="target"
        class="mt-5"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pb-6" @scroll="trackScroll">
      <ul v-if="entries.length">
        <EntryRow
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
          :photo="customPhotos.get(entry.foodId ?? '')"
          @remove="askToRemove"
          @edit="editEntry"
        />
      </ul>

      <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">
        {{ showsToday ? 'Сегодня пока пусто' : 'В этот день записей нет' }}
      </p>

      <div v-if="!showsToday || !entries.length" class="px-4 pt-4">
        <Button :as="RouterLink" :to="addLink" class="w-full">
          Добавить
        </Button>
      </div>
    </div>
  </main>
</template>
