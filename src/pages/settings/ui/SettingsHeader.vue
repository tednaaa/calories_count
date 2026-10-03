<script setup lang="ts">
import { ChevronLeftIcon } from '@lucide/vue';
import { RouterLink } from 'vue-router';

defineProps<{ title: string }>();
</script>

<template>
  <header class="flex items-center gap-1">
    <RouterLink
      to="/settings"
      class="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground"
      aria-label="Назад к настройкам"
    >
      <ChevronLeftIcon class="size-5" />
    </RouterLink>

    <h1 class="text-xl font-semibold text-foreground">
      {{ title }}
    </h1>
  </header>
</template>
