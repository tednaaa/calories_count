<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { Button, toast } from 'shonk-ui';
import { computed, reactive, ref, watch } from 'vue';
import {
  calcTarget,
  draftFromProfile,
  draftsEqual,
  draftToInput,
  ProfileFields,
  saveProfile,
} from '@/entities/profile';
import { formatNumber } from '@/shared/lib';

const props = defineProps<{ profile: Profile }>();

const form = reactive(draftFromProfile(props.profile));

watch(() => props.profile, (next) => {
  Object.assign(form, draftFromProfile(next));
});

const measurements = computed(() => draftToInput(form));
const breakdown = computed(() => (measurements.value ? calcTarget(measurements.value) : null));
const edited = computed(() => !draftsEqual(form, draftFromProfile(props.profile)));

const saving = ref(false);

async function submit() {
  if (!measurements.value) {
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
  <form class="flex flex-col gap-5" @submit.prevent="submit">
    <ProfileFields
      v-model:sex="form.sex"
      v-model:age="form.age"
      v-model:height-cm="form.heightCm"
      v-model:weight-kg="form.weightKg"
      v-model:activity="form.activity"
      v-model:goal="form.goal"
    />

    <p v-if="breakdown" class="text-sm text-text-secondary">
      Расчётная норма: <span class="tabular-nums text-text-primary">{{ formatNumber(breakdown.target) }} ккал</span>
      <span v-if="props.profile.targetOverridden"> — сейчас не применяется, норма задана вручную</span>
    </p>

    <p v-else class="text-sm text-text-warning">
      Возраст, рост или вес выходят за разумные границы.
    </p>

    <Button type="submit" :disabled="!breakdown || !edited" :loading="saving">
      Сохранить профиль
    </Button>
  </form>
</template>
