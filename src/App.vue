<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { Toaster } from 'shonk-ui';
import { RouterView } from 'vue-router';

useColorMode();
</script>

<template>
  <RouterView />

  <Toaster />
</template>
