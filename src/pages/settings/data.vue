<script setup lang="ts">
import DataSection from './ui/DataSection.vue';
import SettingsHeader from './ui/SettingsHeader.vue';
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <SettingsHeader title="Данные" />
    <DataSection class="mt-6" />
  </main>
</template>
