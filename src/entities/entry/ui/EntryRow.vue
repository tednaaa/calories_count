<script setup lang="ts">
import type { Entry } from '@/shared/db';
import { Trash2Icon } from '@lucide/vue';
import { SwipeAction } from 'shonk-ui';
import { computed } from 'vue';
import { FoodThumb, formatAmount } from '@/entities/food';
import { formatNumber, formatTime } from '@/shared/lib';
import { entryAmount, entryKcal } from '../lib/entry';

const props = defineProps<{ entry: Entry; photo?: string }>();

const emit = defineEmits<{
  remove: [entry: Entry];
  edit: [entry: Entry];
}>();

const kcal = computed(() => entryKcal(props.entry));
const amount = computed(() => entryAmount(props.entry));
</script>

<template>
  <SwipeAction
    as="li"
    :trigger-threshold="0.3"
    right-action-aria-label="Удалить"
    class="border-b border-border last:border-b-0"
    @trigger="emit('remove', props.entry)"
  >
    <template #right-action>
      <Trash2Icon />
    </template>

    <div class="flex items-center gap-3 px-4 py-3" @click="emit('edit', props.entry)">
      <FoodThumb :food-id="entry.foodId" :photo="entry.photo ?? props.photo" :name="entry.name" zoomable class="size-11" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-foreground">
          {{ entry.name }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatTime(entry.createdAt) }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="entry.qty !== 1" class="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          ×{{ entry.qty }}
        </span>
        <span v-if="amount !== undefined" class="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {{ formatAmount(amount, entry.unit) }}
        </span>
        <span class="text-sm tabular-nums text-foreground">
          {{ formatNumber(kcal) }}<span class="ml-1 text-xs text-muted-foreground">ккал</span>
        </span>
      </div>
    </div>
  </SwipeAction>
</template>
