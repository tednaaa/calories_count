<script setup lang="ts">
import type { Entry, Profile } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { Button, cn, toast, useConfirm } from 'shonk-ui';
import { computed, ref, useTemplateRef } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  entriesOfDay,
  EntryRow,
  removeEntry,
  restoreEntry,
  totalKcal,
} from '@/entities/entry';
import { photosById, useCustomFoods } from '@/entities/food';
import { loadProfile } from '@/entities/profile';
import { formatDayLabel, isToday, requestedDateKey, shiftDateKey, toDateKey, useLiveQuery } from '@/shared/lib';
import { DayProgress } from '@/widgets/day-progress';
import { nextCompact } from './compact';

const route = useRoute();
const router = useRouter();
const confirmation = useConfirm();

const dateKey = computed(() => requestedDateKey(route.query.date));

const entries = useLiveQuery<Entry[]>(() => entriesOfDay(dateKey.value), [], [dateKey]);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
const customFoods = useCustomFoods();

const customPhotos = computed(() => photosById(customFoods.value));

const eaten = computed(() => totalKcal(entries.value));
const target = computed(() => profile.value?.targetKcal ?? 0);
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

function showDay(date: DateKey) {
  void router.replace({ query: { date } });
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
    <header class="flex shrink-0 items-center justify-between px-2 pt-6">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Предыдущий день"
        @click="showDay(shiftDateKey(dateKey, -1))"
      >
        <ChevronLeft class="size-5" />
      </button>

      <div class="text-center">
        <p class="text-lg font-semibold text-text-primary">
          {{ formatDayLabel(dateKey) }}
        </p>
        <button
          v-if="!showsToday"
          type="button"
          class="text-xs text-text-brand"
          @click="showDay(toDateKey())"
        >
          Вернуться к сегодня
        </button>
      </div>

      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full text-text-secondary disabled:opacity-30"
        :disabled="showsToday"
        aria-label="Следующий день"
        @click="showDay(shiftDateKey(dateKey, 1))"
      >
        <ChevronRight class="size-5" />
      </button>
    </header>

    <div
      ref="summary"
      :class="cn('shrink-0 border-b border-border-default px-4 transition-all duration-300', compact ? 'py-3' : 'py-6')"
    >
      <DayProgress :eaten="eaten" :target="target" :compact="compact" />
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

      <p v-else class="px-4 py-8 text-center text-sm text-text-secondary">
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
