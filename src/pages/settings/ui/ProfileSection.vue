<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { Button, toast } from 'shonk-ui';
import { computed, reactive, ref, watch } from 'vue';
import {
	calcTarget,
	draftFromProfile,
	draftsEqual,
	draftToInput,
	hasInvalidTargetWeight,
	ProfileFields,
	saveProfile,
} from '@/entities/profile';
import { formatNumber } from '@/shared/lib';
import SettingsLayout from './SettingsLayout.vue';

const props = defineProps<{ profile: Profile }>();

const form = reactive(draftFromProfile(props.profile));

watch(() => props.profile, (next) => {
	Object.assign(form, draftFromProfile(next));
});

const measurements = computed(() => draftToInput(form));
const breakdown = computed(() => (
	measurements.value ? calcTarget({ ...measurements.value, tdeeCorrectionKcal: props.profile.tdeeCorrectionKcal }) : null
));
const edited = computed(() => !draftsEqual(form, draftFromProfile(props.profile)));
const canSave = computed(() => breakdown.value !== null && edited.value && !hasInvalidTargetWeight(form));

const saving = ref(false);

async function submit() {
	if (!measurements.value || !canSave.value) {
		return;
	}

	saving.value = true;

	try {
		await saveProfile(measurements.value);
		toast('Профиль сохранён');
	}
	finally {
		saving.value = false;
	}
}
</script>

<template>
	<form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
		<SettingsLayout title="Профиль">
			<div class="flex flex-col gap-5">
				<ProfileFields
					v-model:sex="form.sex"
					v-model:birth-date="form.birthDate"
					v-model:height-cm="form.heightCm"
					v-model:weight-kg="form.weightKg"
					v-model:target-weight-kg="form.targetWeightKg"
					v-model:activity="form.activity"
					v-model:goal="form.goal"
				/>

				<p v-if="breakdown" class="text-sm text-muted-foreground">
					Расчётная норма: <span class="tabular-nums text-foreground">{{ formatNumber(breakdown.target) }} ккал</span>
					<span v-if="props.profile.targetOverridden"> — сейчас не применяется, норма задана вручную</span>
				</p>

				<p v-if="!measurements" class="text-sm text-warning">
					Возраст, рост или вес выходят за разумные границы.
				</p>
			</div>

			<template #footer>
				<Button type="submit" :disabled="!canSave" :loading="saving">
					Сохранить профиль
				</Button>
			</template>
		</SettingsLayout>
	</form>
</template>
