<script setup lang="ts">
import type { CartItem } from '@/entities/entry';
import type { Food } from '@/entities/food';
import { Minus, Plus } from '@lucide/vue';
import { cn } from 'shonk-ui';
import { FoodThumb } from '@/entities/food';
import { formatNumber } from '@/shared/lib';
import { toCartItem } from '../lib/cart';

const props = defineProps<{
  food: Food;
  qty: number;
}>();

const emit = defineEmits<{
  changeQty: [item: CartItem];
}>();

function changeQty(qty: number) {
  emit('changeQty', toCartItem(props.food, qty));
}
</script>

<template>
  <li class="relative">
    <button
      type="button"
      class="flex w-full flex-col gap-1.5 text-left"
      @click="changeQty(props.qty + 1)"
    >
      <FoodThumb
        :food-id="food.id"
        :name="food.name"
        :class="cn('aspect-square w-full rounded-xl', props.qty && 'ring-2 ring-border-brand')"
      />

      <p class="line-clamp-2 text-xs leading-tight text-text-primary">
        {{ food.name }}
      </p>

      <p class="text-[11px] tabular-nums text-text-tertiary">
        {{ formatNumber(food.kcal) }} ккал
      </p>
    </button>

    <div
      v-if="props.qty"
      class="absolute inset-x-0 top-0 flex h-9 items-center rounded-t-xl bg-bg-surface/90 backdrop-blur"
    >
      <button
        type="button"
        class="flex h-full flex-1 items-center justify-center text-text-secondary"
        :aria-label="`Убрать ${food.name}`"
        @click="changeQty(props.qty - 1)"
      >
        <Minus class="size-4" />
      </button>

      <span class="w-6 text-center text-sm font-medium tabular-nums text-text-primary">{{ props.qty }}</span>

      <button
        type="button"
        class="flex h-full flex-1 items-center justify-center text-text-secondary"
        :aria-label="`Добавить ${food.name}`"
        @click="changeQty(props.qty + 1)"
      >
        <Plus class="size-4" />
      </button>
    </div>
  </li>
</template>
