<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { XIcon } from '@lucide/vue';
import { cn, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from 'shonk-ui';
import { computed, ref } from 'vue';
import { foodById, photoUrl } from '../lib/catalog';

const props = defineProps<{
  foodId?: string;
  photo?: string;
  name: string;
  zoomable?: boolean;
  class?: HTMLAttributes['class'];
}>();

const failed = ref(false);
const zoomed = ref(false);

const source = computed(() => {
  if (props.photo) {
    return props.photo;
  }

  const food = props.foodId ? foodById(props.foodId) : undefined;

  return food?.photo ? photoUrl(food) : undefined;
});

const initial = computed(() => props.name.trim().charAt(0).toUpperCase());
const zooms = computed(() => Boolean(props.zoomable && source.value && !failed.value));

function zoom(event: MouseEvent) {
  if (!zooms.value) {
    return;
  }

  event.stopPropagation();
  zoomed.value = true;
}
</script>

<template>
  <div
    :class="cn('flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted', zooms && 'cursor-zoom-in', props.class)"
    @click="zoom"
  >
    <img
      v-if="source && !failed"
      :src="source"
      :alt="name"
      loading="lazy"
      class="size-full object-cover"
      @error="failed = true"
    >
    <span v-else class="text-sm font-medium text-muted-foreground">{{ initial }}</span>

    <Dialog v-model:open="zoomed">
      <DialogContent class="overflow-hidden p-0">
        <DialogTitle class="sr-only">
          {{ name }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          Фото блюда крупным планом
        </DialogDescription>

        <img :src="source" :alt="name" class="max-h-[70svh] w-full object-contain">

        <DialogClose
          class="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white"
          aria-label="Закрыть фото"
        >
          <XIcon class="size-5" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  </div>
</template>
