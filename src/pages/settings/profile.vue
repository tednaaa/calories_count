<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { loadProfile } from '@/entities/profile';
import { useLiveQuery } from '@/shared/lib';
import ProfileSection from './ui/ProfileSection.vue';
import SettingsLayout from './ui/SettingsLayout.vue';

const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
</script>

<template>
  <ProfileSection v-if="profile" :profile="profile" />
  <SettingsLayout v-else title="Профиль" />
</template>
