<script setup lang="ts">
import { Label, Switch } from 'shonk-ui';
import { REMIND_AFTER_DAYS, useWeighInReminder } from '@/entities/weight';

const { enabled } = useWeighInReminder();
</script>

<template>
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between gap-4">
			<Label for="weigh-in-reminder">Напоминать взвеситься</Label>
			<Switch id="weigh-in-reminder" v-model="enabled" />
		</div>
		<p class="text-xs text-muted-foreground">
			Строка «Запишите вес» на главном экране, если вы не взвешивались {{ REMIND_AFTER_DAYS }} дня. Без уведомлений и счётчиков пропусков.
		</p>
	</div>
</template>
