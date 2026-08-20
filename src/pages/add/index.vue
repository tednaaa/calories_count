<script setup lang="ts">
import type { CartItem } from '@/entities/entry';
import type { CategoryId, Portion } from '@/entities/food';
import { Badge, Button, cn, Input, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addEntries, frequentFoodIds } from '@/entities/entry';
import {
  categories,
  foodById,
  matchesQuery,
  photosById,
  searchFoods,
  useCustomFoods,
} from '@/entities/food';
import { formatDayLabel, isToday, requestedDateKey, useLiveQuery } from '@/shared/lib';
import { cartQty, cartSummary, withCartItem } from './lib/cart';
import CartPanel from './ui/CartPanel.vue';
import FoodCard from './ui/FoodCard.vue';

const route = useRoute();
const router = useRouter();

type ChipId = CategoryId | 'all' | 'custom';

const chips: { id: ChipId; name: string }[] = [
  { id: 'all', name: 'Все' },
  { id: 'custom', name: 'Своё' },
  ...categories,
];

const query = ref('');
const category = ref<ChipId>('all');
const items = ref<CartItem[]>([]);
const saving = ref(false);

const dateKey = computed(() => requestedDateKey(route.query.date));

const showsToday = computed(() => isToday(dateKey.value));

const dayQuery = computed(() => (showsToday.value ? {} : { date: dateKey.value }));

function openCustom() {
  void router.push({ path: '/add/custom', query: dayQuery.value });
}

const customFoods = useCustomFoods();

const customPhotos = computed(() => photosById(customFoods.value));

const showsCustom = computed(() => category.value === 'all' || category.value === 'custom');

const custom = computed(() => (
  showsCustom.value ? customFoods.value.filter(food => matchesQuery(food, query.value)) : []
));

const catalog = computed(() => (
  category.value === 'custom'
    ? []
    : searchFoods(query.value, category.value === 'all' ? undefined : category.value)
));

const frequentIds = useLiveQuery<string[]>(() => frequentFoodIds(), []);

function portionById(id: string): Portion | undefined {
  const fromCatalog = foodById(id);

  if (fromCatalog) {
    return fromCatalog.archived ? undefined : fromCatalog;
  }

  return customFoods.value.find(food => food.id === id);
}

const frequent = computed(() => frequentIds.value
  .map(portionById)
  .filter((food): food is Portion => food !== undefined));

const showsFrequent = computed(() => (
  !query.value.trim() && category.value === 'all' && frequent.value.length > 0
));

const emptyText = computed(() => (
  category.value === 'custom' && !query.value.trim() ? 'Своих блюд пока нет' : 'Ничего не нашлось'
));

function changeQty(item: CartItem) {
  items.value = withCartItem(items.value, item);
}

async function confirm() {
  if (saving.value) {
    return;
  }

  saving.value = true;

  try {
    await addEntries(dateKey.value, items.value);
  }
  catch (error) {
    console.error('[confirm]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');

    return;
  }

  toast(`Добавлено: ${cartSummary(items.value)}`);
  await router.push({ path: '/', query: dayQuery.value });
}
</script>

<template>
  <main class="flex min-h-0 flex-1 flex-col">
    <header class="shrink-0 px-4 pt-6 pb-3">
      <div v-if="!showsToday" class="mb-3 flex items-center gap-2">
        <Badge variant="secondary">
          {{ formatDayLabel(dateKey) }}
        </Badge>
        <span class="text-xs text-text-tertiary">запись задним числом</span>
      </div>

      <div class="flex items-center gap-2">
        <Input
          v-model="query"
          type="search"
          enterkeyhint="search"
          placeholder="Поиск блюда"
          class="flex-1"
        />

        <Button variant="outline" @click="openCustom">
          Новое
        </Button>
      </div>
    </header>

    <div class="scrollbar-none shrink-0 overflow-x-auto pb-6">
      <div class="flex w-max gap-2 px-4">
        <button
          v-for="chip in chips"
          :key="chip.id"
          type="button"
          :class="cn(
            'rounded-full border px-3 py-1.5 text-xs whitespace-nowrap',
            category === chip.id
              ? 'border-transparent bg-bg-brand text-text-inverse'
              : 'border-border-default text-text-secondary',
          )"
          @click="category = chip.id"
        >
          {{ chip.name }}
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
      <template v-if="showsFrequent">
        <h2 class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase">
          Часто
        </h2>

        <ul class="mb-6 grid grid-cols-3 gap-3">
          <FoodCard
            v-for="food in frequent"
            :key="food.id"
            :food="food"
            :photo="customPhotos.get(food.id)"
            :qty="cartQty(items, food.id)"
            @change-qty="changeQty"
          />
        </ul>
      </template>

      <template v-if="custom.length">
        <h2
          v-if="showsFrequent || catalog.length"
          class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase"
        >
          Своё
        </h2>

        <ul class="mb-6 grid grid-cols-3 gap-3">
          <FoodCard
            v-for="food in custom"
            :key="food.id"
            :food="food"
            :photo="food.photo"
            :qty="cartQty(items, food.id)"
            @change-qty="changeQty"
          />
        </ul>
      </template>

      <template v-if="catalog.length">
        <h2
          v-if="showsFrequent || custom.length"
          class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase"
        >
          Всё
        </h2>

        <ul class="grid grid-cols-3 gap-3">
          <FoodCard
            v-for="food in catalog"
            :key="food.id"
            :food="food"
            :qty="cartQty(items, food.id)"
            @change-qty="changeQty"
          />
        </ul>
      </template>

      <div v-if="!custom.length && !catalog.length" class="py-8 text-center">
        <p class="text-sm text-text-secondary">
          {{ emptyText }}
        </p>

        <Button variant="outline" class="mt-3" @click="openCustom">
          Добавить своё
        </Button>
      </div>
    </div>

    <Teleport defer to="#bottom-dock">
      <CartPanel
        v-if="items.length"
        :items="items"
        :photos="customPhotos"
        :saving="saving"
        @change-qty="changeQty"
        @confirm="confirm"
      />
    </Teleport>
  </main>
</template>
