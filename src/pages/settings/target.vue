<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { loadProfile } from '@/entities/profile';
import { useLiveQuery } from '@/shared/lib';
import SettingsLayout from './ui/SettingsLayout.vue';
import TargetSection from './ui/TargetSection.vue';

const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
</script>

<template>
	<SettingsLayout title="Норма">
		<TargetSection v-if="profile" :profile="profile" />
	</SettingsLayout>
</template>
