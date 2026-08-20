<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from 'shonk-ui';
import { computed, ref } from 'vue';
import { foodById, photoUrl } from '../lib/catalog';

const props = defineProps<{
  foodId?: string;
  photo?: string;
  name: string;
  class?: HTMLAttributes['class'];
}>();

const failed = ref(false);

const source = computed(() => {
  if (props.photo) {
    return props.photo;
  }

  const food = props.foodId ? foodById(props.foodId) : undefined;

  return food ? photoUrl(food) : undefined;
});

const initial = computed(() => props.name.trim().charAt(0).toUpperCase());
</script>

<template>
  <div :class="cn('flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-muted', props.class)">
    <img
      v-if="source && !failed"
      :src="source"
      :alt="name"
      loading="lazy"
      class="size-full object-cover"
      @error="failed = true"
    >
    <span v-else class="text-sm font-medium text-text-tertiary">{{ initial }}</span>
  </div>
</template>
