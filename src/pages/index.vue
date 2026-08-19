<script setup lang="ts">
import type { Entry, Profile } from '@/shared/db';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { Button, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  entriesOfDay,
  EntryRow,
  removeEntry,
  restoreEntry,
  setEntryQty,
  totalKcal,
} from '@/entities/entry';
import { loadProfile } from '@/entities/profile';
import { formatDayLabel, isToday, shiftDateKey, toDateKey, useLiveQuery } from '@/shared/lib';
import { DayProgress } from '@/widgets/day-progress';

const dateKey = ref(toDateKey());

const entries = useLiveQuery<Entry[]>(() => entriesOfDay(dateKey.value), [], [dateKey]);
const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);

const eaten = computed(() => totalKcal(entries.value));
const target = computed(() => profile.value?.targetKcal ?? 0);
const showsToday = computed(() => isToday(dateKey.value));
const addLink = computed(() => (showsToday.value ? '/add' : `/add?date=${dateKey.value}`));

function shiftDay(days: number) {
  dateKey.value = shiftDateKey(dateKey.value, days);
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

async function changeQty(id: string, qty: number) {
  if (qty >= 1) {
    await setEntryQty(id, qty);
  }
}
</script>

<template>
  <main class="flex-1 pb-6">
    <header class="flex items-center justify-between px-2 pt-6">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Предыдущий день"
        @click="shiftDay(-1)"
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
          @click="dateKey = toDateKey()"
        >
          Вернуться к сегодня
        </button>
      </div>

      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full text-text-secondary disabled:opacity-30"
        :disabled="showsToday"
        aria-label="Следующий день"
        @click="shiftDay(1)"
      >
        <ChevronRight class="size-5" />
      </button>
    </header>

    <div class="px-4 py-6">
      <DayProgress :eaten="eaten" :target="target" />
    </div>

    <ul v-if="entries.length" class="border-t border-border-default">
      <EntryRow
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @remove="remove"
        @change-qty="changeQty"
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
  </main>
</template>
