<script setup lang="ts">
import type { Entry } from '@/shared/db';
import { Trash2Icon } from '@lucide/vue';
import { useSwipe } from '@vueuse/core';
import { cn } from 'shonk-ui';
import { computed, ref, useTemplateRef } from 'vue';
import { FoodThumb, formatGrams } from '@/entities/food';
import { formatNumber, formatTime } from '@/shared/lib';
import { entryGrams, entryKcal } from '../lib/entry';

const props = defineProps<{ entry: Entry; photo?: string }>();

const emit = defineEmits<{
  remove: [entry: Entry];
  edit: [entry: Entry];
}>();

const SWIPE_START = 24;
const REMOVE_THRESHOLD = 96;

const row = useTemplateRef<HTMLElement>('row');
const offset = ref(0);

let sideways: boolean | undefined;

const { lengthX, direction, isSwiping } = useSwipe(row, {
  threshold: SWIPE_START,
  onSwipeStart() {
    sideways = undefined;
  },
  onSwipe() {
    sideways ??= direction.value === 'left';

    if (sideways) {
      offset.value = Math.min(0, SWIPE_START - lengthX.value);
    }
  },
  onSwipeEnd() {
    if (offset.value <= -REMOVE_THRESHOLD) {
      emit('remove', props.entry);
    }

    offset.value = 0;
  },
});

const kcal = computed(() => entryKcal(props.entry));
const grams = computed(() => entryGrams(props.entry));
</script>

<template>
  <li class="relative overflow-hidden border-b border-border-default last:border-b-0">
    <div class="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-bg-danger text-text-inverse">
      <Trash2Icon class="size-5" />
    </div>

    <div
      ref="row"
      :class="cn('relative flex items-center gap-3 bg-bg-surface px-4 py-3', !isSwiping && 'transition-transform')"
      :style="{ transform: `translateX(${offset}px)` }"
      @click="emit('edit', props.entry)"
    >
      <FoodThumb :food-id="entry.foodId" :photo="entry.photo ?? props.photo" :name="entry.name" zoomable class="size-11" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-text-primary">
          {{ entry.name }}
        </p>
        <p class="text-xs text-text-tertiary">
          {{ formatTime(entry.createdAt) }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="entry.qty !== 1" class="rounded-full bg-bg-muted px-2 py-0.5 text-xs tabular-nums text-text-secondary">
          ×{{ entry.qty }}
        </span>
        <span v-if="grams !== undefined" class="rounded-full bg-bg-muted px-2 py-0.5 text-xs tabular-nums text-text-secondary">
          {{ formatGrams(grams) }}
        </span>
        <span class="text-sm tabular-nums text-text-primary">
          {{ formatNumber(kcal) }}<span class="ml-1 text-xs text-text-tertiary">ккал</span>
        </span>
      </div>
    </div>
  </li>
</template>
