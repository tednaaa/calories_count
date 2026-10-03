<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { loadProfile } from '@/entities/profile';
import { useLiveQuery } from '@/shared/lib';
import ProfileSection from './ui/ProfileSection.vue';
import SettingsHeader from './ui/SettingsHeader.vue';

const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <SettingsHeader title="Профиль" />
    <ProfileSection v-if="profile" :profile="profile" class="mt-6" />
  </main>
</template>
