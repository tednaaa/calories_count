<script setup lang="ts">
import SettingsHeader from './SettingsHeader.vue';

defineProps<{
	title: string;
	back?: string;
	backLabel?: string;
}>();
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col">
		<SettingsHeader :title :back :back-label class="shrink-0 px-4 pt-6 pb-2" />

		<main class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
			<slot />
		</main>

		<footer v-if="$slots.footer" class="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
			<slot name="footer" />
		</footer>
	</div>
</template>
