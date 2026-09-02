<script setup lang="ts">
import type { CartItem } from '@/entities/entry';
import { ChevronUpIcon, MinusIcon, PlusIcon, XIcon } from '@lucide/vue';
import { Button, cn } from 'shonk-ui';
import { ref } from 'vue';
import { decreaseQty, increaseQty } from '@/entities/entry';
import { FoodThumb } from '@/entities/food';
import { cartSummary } from '../lib/cart';

const props = defineProps<{
  items: CartItem[];
  photos: Map<string, string | undefined>;
  saving: boolean;
}>();

const emit = defineEmits<{
  changeQty: [item: CartItem];
  confirm: [];
}>();

const expanded = ref(false);

function changeQty(item: CartItem, qty: number) {
  emit('changeQty', { ...item, qty });
}
</script>

<template>
  <section class="border-t border-border bg-background">
    <ul v-if="expanded" class="max-h-56 overflow-y-auto border-b border-border">
      <li
        v-for="item in props.items"
        :key="item.foodId"
        class="flex items-center gap-3 px-4 py-2"
      >
        <FoodThumb :food-id="item.foodId" :photo="props.photos.get(item.foodId)" :name="item.name" class="size-9" />

        <p class="min-w-0 flex-1 truncate text-sm text-foreground">
          {{ item.name }}
        </p>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
          :aria-label="`Меньше ${item.name}`"
          @click="changeQty(item, decreaseQty(item.qty))"
        >
          <MinusIcon class="size-4" />
        </button>

        <span class="w-9 text-center text-sm tabular-nums text-foreground">{{ item.qty }}</span>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
          :aria-label="`Больше ${item.name}`"
          @click="changeQty(item, increaseQty(item.qty))"
        >
          <PlusIcon class="size-4" />
        </button>

        <button
          type="button"
          class="flex size-8 items-center justify-center text-muted-foreground"
          :aria-label="`Убрать ${item.name}`"
          @click="changeQty(item, 0)"
        >
          <XIcon class="size-4" />
        </button>
      </li>
    </ul>

    <div class="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-1 text-left"
        @click="expanded = !expanded"
      >
        <span class="truncate text-sm text-foreground">{{ cartSummary(props.items) }}</span>
        <ChevronUpIcon :class="cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')" />
      </button>

      <Button :loading="props.saving" @click="emit('confirm')">
        Подтвердить
      </Button>
    </div>
  </section>
</template>
