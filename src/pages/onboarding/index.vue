<script setup lang="ts">
import { Button } from 'shonk-ui';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { calcTarget, draftToInput, emptyDraft, ProfileFields, saveProfile } from '@/entities/profile';
import { formatNumber } from '@/shared/lib';

const router = useRouter();

const form = reactive(emptyDraft());

const measurements = computed(() => draftToInput(form));
const breakdown = computed(() => (measurements.value ? calcTarget(measurements.value) : null));

const saving = ref(false);

async function submit() {
  if (!measurements.value) {
    return;
  }

  saving.value = true;
  await saveProfile(measurements.value);
  await router.push('/');
}
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-8">
    <h1 class="text-2xl font-semibold text-text-primary">
      Норма калорий
    </h1>
    <p class="mt-1 text-sm text-text-secondary">
      Считаем один раз. Потом можно поменять в настройках.
    </p>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <ProfileFields
        v-model:sex="form.sex"
        v-model:age="form.age"
        v-model:height-cm="form.heightCm"
        v-model:weight-kg="form.weightKg"
        v-model:activity="form.activity"
        v-model:goal="form.goal"
      />

      <div class="rounded-lg border border-border-default bg-bg-subtle p-4">
        <template v-if="breakdown">
          <p class="text-3xl font-semibold tabular-nums text-text-primary">
            {{ formatNumber(breakdown.target) }}
            <span class="text-base font-normal text-text-secondary">ккал в день</span>
          </p>
          <p class="mt-2 text-xs text-text-tertiary">
            Базовый обмен {{ formatNumber(Math.round(breakdown.bmr)) }},
            полный расход {{ formatNumber(Math.round(breakdown.tdee)) }} ккал
          </p>
          <p v-if="breakdown.clampedToMinimum" class="mt-2 text-xs text-text-warning">
            Расчёт дал меньше безопасного минимума, норма поднята до {{ formatNumber(breakdown.target) }} ккал.
          </p>
        </template>

        <p v-else class="text-sm text-text-secondary">
          Заполни возраст, рост и вес, чтобы увидеть норму.
        </p>
      </div>

      <Button type="submit" size="lg" :disabled="!breakdown" :loading="saving">
        Начать
      </Button>
    </form>
  </main>
</template>
