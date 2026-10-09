<script setup lang="ts">
import { ChevronLeftIcon } from '@lucide/vue';
import { RouterLink } from 'vue-router';

const { back = '/settings', backLabel = 'Назад к настройкам' } = defineProps<{
	title: string;
	back?: string;
	backLabel?: string;
}>();
</script>

<template>
	<header class="flex items-center gap-1">
		<RouterLink
			:to="back"
			class="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground"
			:aria-label="backLabel"
		>
			<ChevronLeftIcon class="size-5" />
		</RouterLink>

		<h1 class="text-xl font-semibold text-foreground">
			{{ title }}
		</h1>
	</header>
</template>
