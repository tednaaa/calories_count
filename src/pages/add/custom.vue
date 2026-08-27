<script setup lang="ts">
import type { CustomFood } from '@/shared/db';
import { ChevronLeftIcon } from '@lucide/vue';
import { Badge, Button, Switch, toast } from 'shonk-ui';
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  CustomFoodFields,
  draftFromCustomFood,
  draftToCustomFood,
  emptyCustomDraft,
  findCustomFoodByBarcode,
  isBarcode,
  lookupBarcode,
  productToDraft,
} from '@/entities/food';
import { formatDayLabel, isToday, requestedDateKey } from '@/shared/lib';
import { addCustomFoodToDay, addCustomOnceToDay } from './lib/custom';

const route = useRoute();
const router = useRouter();

const draft = ref(emptyCustomDraft());
const saves = ref(false);
const saving = ref(false);
const looking = ref(false);

const dateKey = computed(() => requestedDateKey(route.query.date));
const showsToday = computed(() => isToday(dateKey.value));
const dayQuery = computed(() => (showsToday.value ? {} : { date: dateKey.value }));
const input = computed(() => draftToCustomFood(draft.value));

function missReason(state: 'missing' | 'offline'): string {
  if (state === 'missing') {
    return 'В базе продуктов такого нет. Заполни сам — в следующий раз узнаю по коду';
  }

  return navigator.onLine
    ? 'База продуктов не отвечает. Заполни сам, состав добавлю при следующем сканировании'
    : 'Нет связи с базой продуктов. Заполни сам, состав добавлю при следующем сканировании';
}

async function fillKnownFood(own: CustomFood, code: string) {
  draft.value = draftFromCustomFood(own);

  if (own.nutrients) {
    toast(`Знакомый продукт: ${own.name}`);
    return;
  }

  const found = await lookupBarcode(code);

  if (found.state === 'found' && found.product.nutrients) {
    draft.value = { ...draft.value, nutrients: found.product.nutrients, grades: found.product.grades };
    toast(`${own.name} — добавил состав из базы продуктов`);
    return;
  }

  toast(`Знакомый продукт: ${own.name}`);
}

async function fillFromBarcode(code: string) {
  looking.value = true;

  const own = await findCustomFoodByBarcode(code);

  if (own) {
    await fillKnownFood(own, code);
    looking.value = false;
    return;
  }

  const found = await lookupBarcode(code);

  looking.value = false;
  saves.value = true;

  if (found.state !== 'found') {
    draft.value = { ...draft.value, barcode: code };
    toast(missReason(found.state));
    return;
  }

  draft.value = { ...productToDraft(found.product), barcode: code };

  if (found.product.kcalPerHundred === undefined) {
    toast('Нашёл продукт, но калорийности в базе нет — впиши с упаковки');
  }
}

onMounted(() => {
  const code = String(route.query.barcode ?? '');

  if (isBarcode(code)) {
    void fillFromBarcode(code);
  }
});

async function submit() {
  const food = input.value;

  if (!food || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await (saves.value ? addCustomFoodToDay : addCustomOnceToDay)(dateKey.value, food);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast(`Добавлено: ${food.name}`);
  await router.push({ path: '/', query: dayQuery.value });
}
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-6">
    <header class="flex items-center gap-1">
      <RouterLink
        :to="{ path: '/add', query: dayQuery }"
        class="-ml-2 flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Назад к каталогу"
      >
        <ChevronLeftIcon class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-text-primary">
        Своё блюдо
      </h1>
    </header>

    <div v-if="!showsToday" class="mt-3 flex items-center gap-2">
      <Badge variant="secondary">
        {{ formatDayLabel(dateKey) }}
      </Badge>
      <span class="text-xs text-text-tertiary">запись задним числом</span>
    </div>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <CustomFoodFields v-model="draft" :busy="looking" />

      <div class="flex items-center gap-3 rounded-lg border border-border-default p-3">
        <button type="button" class="min-w-0 flex-1 text-left text-sm text-text-primary" @click="saves = !saves">
          {{ draft.barcode ? 'Сохранить в избранное и запомнить штрих-код' : 'Сохранить в избранное' }}
        </button>

        <Switch id="custom-saves" v-model="saves" />
      </div>

      <Button type="submit" size="lg" :disabled="!input" :loading="saving">
        Добавить в день
      </Button>
    </form>
  </main>
</template>
