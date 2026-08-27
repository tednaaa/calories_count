<script setup lang="ts">
import type { CartItem } from '@/entities/entry';
import type { Portion } from '@/entities/food';
import { MinusIcon, PlusIcon } from '@lucide/vue';
import { cn } from 'shonk-ui';
import { decreaseQty, increaseQty, toggleQty } from '@/entities/entry';
import { FoodThumb, formatServing } from '@/entities/food';
import { toCartItem } from '../lib/cart';

const props = defineProps<{
  food: Portion;
  photo?: string;
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
  <li class="flex items-center gap-2 border-b border-border-default last:border-b-0">
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
      @click="changeQty(toggleQty(props.qty))"
    >
      <FoodThumb
        :food-id="food.id"
        :photo="props.photo"
        :name="food.name"
        :class="cn('size-11 rounded-lg', props.qty && 'ring-2 ring-border-brand')"
      />

      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm text-text-primary">{{ food.name }}</span>
        <span class="block text-xs tabular-nums text-text-tertiary">{{ formatServing(food.kcal, food.amount, food.unit) }}</span>
      </span>
    </button>

    <div v-if="props.qty" class="flex shrink-0 items-center">
      <button
        type="button"
        class="flex size-9 items-center justify-center text-text-secondary"
        :aria-label="`Убрать ${food.name}`"
        @click="changeQty(decreaseQty(props.qty))"
      >
        <MinusIcon class="size-4" />
      </button>

      <span class="w-9 text-center text-sm font-medium tabular-nums text-text-primary">{{ props.qty }}</span>

      <button
        type="button"
        class="flex size-9 items-center justify-center text-text-secondary"
        :aria-label="`Добавить ${food.name}`"
        @click="changeQty(increaseQty(props.qty))"
      >
        <PlusIcon class="size-4" />
      </button>
    </div>
  </li>
</template>
