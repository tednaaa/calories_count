<script setup lang="ts">
import type { Entry } from '@/shared/db';
import { ChevronLeft, Minus, Plus } from '@lucide/vue';
import { Badge, Button, Switch, toast, useConfirm } from 'shonk-ui';
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  decreaseQty,
  draftFromEntry,
  draftToEntry,
  HALF_PORTION,
  increaseQty,
  loadEntry,
  removeEntry,
  restoreEntry,
  saveEntry,
} from '@/entities/entry';
import { CustomFoodFields, emptyCustomDraft } from '@/entities/food';
import { formatDayLabel, formatNumber, isToday } from '@/shared/lib';
import { keepEntryAsFood } from './lib/keep';

const route = useRoute('/entry/[id]');
const router = useRouter();
const confirmation = useConfirm();

const entry = ref<Entry>();
const draft = ref(emptyCustomDraft());
const qty = ref(1);
const keeps = ref(false);
const saving = ref(false);

const item = computed(() => draftToEntry(draft.value));
const keepsHint = computed(() => (keeps.value
  ? 'Появится в сетке «Добавить» — в следующий раз хватит тапа по карточке.'
  : 'Пока это разовая запись: она есть только в этом дне.'));
const showsToday = computed(() => !entry.value || isToday(entry.value.date));
const dayQuery = computed(() => (showsToday.value || !entry.value ? {} : { date: entry.value.date }));
const total = computed(() => (item.value ? item.value.kcalPerPortion * qty.value : 0));

onMounted(async () => {
  const stored = await loadEntry(route.params.id);

  if (!stored) {
    await router.replace('/');
    return;
  }

  entry.value = stored;
  draft.value = draftFromEntry(stored);
  qty.value = stored.qty;
});

async function submit() {
  const current = entry.value;
  const next = item.value;

  if (!current || !next || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await (keeps.value ? keepEntryAsFood : saveEntry)(current, next, qty.value);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast(keeps.value ? `«${next.name}» теперь и в «Своём»` : 'Запись сохранена');
  await router.push({ path: '/', query: dayQuery.value });
}

async function remove(current: Entry) {
  await removeEntry(current.id);

  toast('Запись удалена', {
    action: {
      label: 'Вернуть',
      onClick: () => {
        void restoreEntry(current);
      },
    },
  });

  await router.push({ path: '/', query: dayQuery.value });
}

function askToRemove() {
  const current = entry.value;

  if (!current) {
    return;
  }

  confirmation.require({
    message: `«${current.name}» пропадёт из дневника за этот день.`,
    acceptLabel: 'Удалить',
    accept: () => {
      void remove(current);
    },
  });
}
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <header class="flex items-center gap-1">
      <RouterLink
        :to="{ path: '/', query: dayQuery }"
        class="-ml-2 flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Назад в день"
      >
        <ChevronLeft class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-text-primary">
        Запись
      </h1>
    </header>

    <div v-if="entry && !showsToday" class="mt-3">
      <Badge variant="secondary">
        {{ formatDayLabel(entry.date) }}
      </Badge>
    </div>

    <p class="mt-1 text-sm text-text-secondary">
      Правка меняет только эту запись: блюдо в каталоге и в «Своём» останется прежним.
    </p>

    <form v-if="entry" class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <CustomFoodFields
        v-model:name="draft.name"
        v-model:kcal="draft.kcal"
        v-model:photo="draft.photo"
        :food-id="entry.foodId"
      />

      <div class="flex items-center justify-between gap-3 rounded-lg border border-border-default p-3">
        <div class="min-w-0">
          <span class="text-sm text-text-primary">Порций</span>
          <span class="mt-1 block text-xs text-text-tertiary">Итого {{ formatNumber(total) }} ккал</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full border border-border-default text-text-secondary disabled:opacity-40"
            :disabled="qty <= HALF_PORTION"
            aria-label="Меньше"
            @click="qty = decreaseQty(qty)"
          >
            <Minus class="size-4" />
          </button>

          <span class="w-9 text-center text-sm tabular-nums text-text-primary">{{ qty }}</span>

          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full border border-border-default text-text-secondary"
            aria-label="Больше"
            @click="qty = increaseQty(qty)"
          >
            <Plus class="size-4" />
          </button>
        </div>
      </div>

      <div v-if="!entry.foodId" class="flex items-center gap-3 rounded-lg border border-border-default p-3">
        <button type="button" class="min-w-0 flex-1 text-left" @click="keeps = !keeps">
          <span class="text-sm text-text-primary">Оставить в «Своём»</span>
          <span class="mt-1 block text-xs text-text-tertiary">{{ keepsHint }}</span>
        </button>

        <Switch id="entry-keeps" v-model="keeps" />
      </div>

      <Button type="submit" size="lg" :disabled="!item" :loading="saving">
        Сохранить
      </Button>

      <Button type="button" variant="destructive" @click="askToRemove">
        Удалить запись
      </Button>
    </form>
  </main>
</template>
