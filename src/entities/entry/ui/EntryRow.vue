<script setup lang="ts">
import type { Entry } from '@/shared/db';
import { Minus, Plus, Trash2 } from '@lucide/vue';
import { useSwipe } from '@vueuse/core';
import { cn } from 'shonk-ui';
import { computed, ref, useTemplateRef } from 'vue';
import { FoodThumb } from '@/entities/food';
import { formatNumber, formatTime } from '@/shared/lib';
import { decreaseQty, entryKcal, HALF_PORTION, increaseQty } from '../lib/entry';

const props = defineProps<{ entry: Entry; photo?: string }>();

const emit = defineEmits<{
  remove: [entry: Entry];
  changeQty: [id: string, qty: number];
}>();

const REMOVE_THRESHOLD = 96;

const row = useTemplateRef<HTMLElement>('row');
const offset = ref(0);
const expanded = ref(false);

const { lengthX, isSwiping } = useSwipe(row, {
  threshold: 12,
  onSwipe() {
    offset.value = Math.min(0, -lengthX.value);
  },
  onSwipeEnd() {
    if (offset.value <= -REMOVE_THRESHOLD) {
      emit('remove', props.entry);
    }

    offset.value = 0;
  },
});

const kcal = computed(() => entryKcal(props.entry));
</script>

<template>
  <li class="relative overflow-hidden border-b border-border-default last:border-b-0">
    <div class="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-bg-danger text-text-inverse">
      <Trash2 class="size-5" />
    </div>

    <div
      ref="row"
      :class="cn('relative flex items-center gap-3 bg-bg-surface px-4 py-3', !isSwiping && 'transition-transform')"
      :style="{ transform: `translateX(${offset}px)` }"
      @click="expanded = !expanded"
    >
      <FoodThumb :food-id="entry.foodId" :photo="props.photo ?? entry.photo" :name="entry.name" class="size-11" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-text-primary">
          {{ entry.name }}
        </p>
        <p class="text-xs text-text-tertiary">
          {{ formatTime(entry.createdAt) }}
        </p>
      </div>

      <div v-if="expanded" class="flex items-center gap-2" @click.stop>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-full border border-border-default text-text-secondary disabled:opacity-40"
          :disabled="entry.qty <= HALF_PORTION"
          aria-label="Меньше"
          @click="emit('changeQty', entry.id, decreaseQty(entry.qty))"
        >
          <Minus class="size-4" />
        </button>

        <span class="w-9 text-center text-sm tabular-nums text-text-primary">{{ entry.qty }}</span>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-full border border-border-default text-text-secondary"
          aria-label="Больше"
          @click="emit('changeQty', entry.id, increaseQty(entry.qty))"
        >
          <Plus class="size-4" />
        </button>
      </div>

      <div v-else class="flex items-center gap-2">
        <span v-if="entry.qty !== 1" class="rounded-full bg-bg-muted px-2 py-0.5 text-xs tabular-nums text-text-secondary">
          ×{{ entry.qty }}
        </span>
        <span class="text-sm tabular-nums text-text-primary">{{ formatNumber(kcal) }}</span>
      </div>
    </div>
  </li>
</template>
