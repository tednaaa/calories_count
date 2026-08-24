<script setup lang="ts">
import type { ViewMode } from './lib/view-mode';
import type { CartItem } from '@/entities/entry';
import type { CategoryId, Portion } from '@/entities/food';
import { Grid2x2Icon, LayoutGridIcon, ListIcon } from '@lucide/vue';
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  toast,
} from 'shonk-ui';
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
import { cartSummary, withCartItem } from './lib/cart';
import { useViewMode, viewModeName, viewModes } from './lib/view-mode';
import CartPanel from './ui/CartPanel.vue';
import FoodSection from './ui/FoodSection.vue';

const route = useRoute();
const router = useRouter();

type ChipId = CategoryId | 'all' | 'custom';

const chips: { id: ChipId; name: string }[] = [
  { id: 'all', name: 'Все' },
  { id: 'custom', name: 'Своё' },
  ...categories,
];

const viewIcons = { grid: LayoutGridIcon, large: Grid2x2Icon, list: ListIcon };

const query = ref('');
const category = ref<ChipId>('all');
const items = ref<CartItem[]>([]);
const saving = ref(false);

const view = useViewMode();

const viewIcon = computed(() => viewIcons[view.value] ?? LayoutGridIcon);

function chooseView(mode: unknown) {
  view.value = mode as ViewMode;
}

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

    <div class="flex shrink-0 items-center gap-2 border-b border-border-default pb-3 pl-4">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default text-text-secondary"
            :aria-label="`Вид: ${viewModeName(view)}`"
          >
            <component :is="viewIcon" class="size-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup :model-value="view" @update:model-value="chooseView">
            <DropdownMenuRadioItem v-for="mode in viewModes" :key="mode.id" :value="mode.id">
              <component :is="viewIcons[mode.id]" class="size-4" />
              {{ mode.name }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="scrollbar-none min-w-0 flex-1 overflow-x-auto">
        <div class="flex w-max gap-2 pr-4">
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
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
      <template v-if="showsFrequent">
        <h2 class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase">
          Часто
        </h2>

        <FoodSection
          :foods="frequent"
          :photos="customPhotos"
          :items="items"
          :mode="view"
          @change-qty="changeQty"
        />
      </template>

      <template v-if="custom.length">
        <h2
          v-if="showsFrequent || catalog.length"
          class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase"
        >
          Своё
        </h2>

        <FoodSection
          :foods="custom"
          :photos="customPhotos"
          :items="items"
          :mode="view"
          @change-qty="changeQty"
        />
      </template>

      <template v-if="catalog.length">
        <h2
          v-if="showsFrequent || custom.length"
          class="pb-2 text-xs font-medium tracking-wide text-text-tertiary uppercase"
        >
          Всё
        </h2>

        <FoodSection
          :foods="catalog"
          :photos="customPhotos"
          :items="items"
          :mode="view"
          @change-qty="changeQty"
        />
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
