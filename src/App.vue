<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { ConfirmDialog, Toaster } from 'shonk-ui';
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { BottomNav } from '@/widgets/bottom-nav';

useColorMode();

const route = useRoute();
const showsNav = computed(() => route.path !== '/onboarding');
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg-surface pt-[env(safe-area-inset-top)]">
    <RouterView />

    <div class="sticky bottom-0">
      <div id="bottom-dock" />

      <BottomNav v-if="showsNav" />
    </div>
  </div>

  <ConfirmDialog />
  <Toaster />
</template>
