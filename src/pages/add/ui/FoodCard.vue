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
  <li class="relative">
    <button
      type="button"
      class="flex w-full flex-col gap-1.5 text-left"
      @click="changeQty(toggleQty(props.qty))"
    >
      <FoodThumb
        :food-id="food.id"
        :photo="props.photo"
        :name="food.name"
        :class="cn('aspect-square w-full rounded-xl', props.qty && 'ring-2 ring-ring')"
      />

      <p class="line-clamp-2 text-xs leading-tight text-foreground">
        {{ food.name }}
      </p>

      <p class="text-[11px] tabular-nums text-muted-foreground">
        {{ formatServing(food.kcal, food.amount, food.unit) }}
      </p>
    </button>

    <div
      v-if="props.qty"
      class="absolute inset-x-0 top-0 flex h-9 items-center rounded-t-xl bg-background/90 backdrop-blur"
    >
      <button
        type="button"
        class="flex h-full flex-1 items-center justify-center text-muted-foreground"
        :aria-label="`Убрать ${food.name}`"
        @click="changeQty(decreaseQty(props.qty))"
      >
        <MinusIcon class="size-4" />
      </button>

      <span class="w-9 text-center text-sm font-medium tabular-nums text-foreground">{{ props.qty }}</span>

      <button
        type="button"
        class="flex h-full flex-1 items-center justify-center text-muted-foreground"
        :aria-label="`Добавить ${food.name}`"
        @click="changeQty(increaseQty(props.qty))"
      >
        <PlusIcon class="size-4" />
      </button>
    </div>
  </li>
</template>
