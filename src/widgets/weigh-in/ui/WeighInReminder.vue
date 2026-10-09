<script setup lang="ts">
import type { WeightRecord } from '@/shared/db';
import { ScaleIcon, XIcon } from '@lucide/vue';
import { computed, ref } from 'vue';
import { lastWeight, shouldRemindWeighIn, useWeighInReminder } from '@/entities/weight';
import { useLiveQuery, useToday } from '@/shared/lib';
import WeighInDialog from './WeighInDialog.vue';

const latest = useLiveQuery<WeightRecord | null | undefined>(async () => await lastWeight() ?? null, undefined);
const { enabled, postponedOn, postpone } = useWeighInReminder();
const today = useToday();

const weighing = ref(false);

const visible = computed(() => latest.value !== undefined && shouldRemindWeighIn({
	lastDate: latest.value?.date,
	today: today.value,
	postponedOn: postponedOn.value,
	enabled: enabled.value,
}));
</script>

<template>
	<div v-if="visible" class="flex items-center gap-2 px-4 pt-3">
		<button
			type="button"
			class="flex flex-1 items-center gap-2 text-left text-sm text-muted-foreground"
			@click="weighing = true"
		>
			<ScaleIcon class="size-4 shrink-0" />
			Запишите вес
		</button>
		<button
			type="button"
			class="flex size-8 items-center justify-center text-muted-foreground"
			aria-label="Не напоминать сегодня"
			@click="postpone"
		>
			<XIcon class="size-4" />
		</button>
	</div>

	<WeighInDialog v-model:open="weighing" :last-kg="latest?.kg" />
</template>
