<script setup lang="ts">
import type { ViewMode } from '../lib/view-mode';
import type { CartItem } from '@/entities/entry';
import type { Portion } from '@/entities/food';
import { cn } from 'shonk-ui';
import { cartQty } from '../lib/cart';
import FoodCard from './FoodCard.vue';
import FoodRow from './FoodRow.vue';

const props = defineProps<{
  foods: Portion[];
  photos: Map<string, string | undefined>;
  items: CartItem[];
  mode: ViewMode;
}>();

const emit = defineEmits<{
  changeQty: [item: CartItem];
}>();
</script>

<template>
  <ul v-if="props.mode === 'list'" class="mb-6 flex flex-col">
    <FoodRow
      v-for="food in props.foods"
      :key="food.id"
      :food="food"
      :photo="props.photos.get(food.id)"
      :qty="cartQty(props.items, food.id)"
      @change-qty="emit('changeQty', $event)"
    />
  </ul>

  <ul v-else :class="cn('mb-6 grid gap-3', props.mode === 'large' ? 'grid-cols-2' : 'grid-cols-3')">
    <FoodCard
      v-for="food in props.foods"
      :key="food.id"
      :food="food"
      :photo="props.photos.get(food.id)"
      :qty="cartQty(props.items, food.id)"
      @change-qty="emit('changeQty', $event)"
    />
  </ul>
</template>
