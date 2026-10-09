<script setup lang="ts">
import { ChevronRightIcon } from '@lucide/vue';
import { RouterLink } from 'vue-router';

defineProps<{ to: string; title: string; hint?: string; value?: string }>();
</script>

<template>
	<RouterLink :to="to" class="flex min-h-14 items-center gap-3 px-4 py-3">
		<div class="min-w-0 flex-1">
			<p class="text-sm text-foreground">
				{{ title }}
			</p>
			<p v-if="hint" class="truncate text-xs text-muted-foreground">
				{{ hint }}
			</p>
		</div>

		<span v-if="value" class="shrink-0 text-sm tabular-nums text-muted-foreground">
			{{ value }}
		</span>
		<ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
	</RouterLink>
</template>
