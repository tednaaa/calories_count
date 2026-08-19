<script setup lang="ts">
import type { CalcInput } from '@/entities/profile';
import type { ActivityLevel, Goal, Sex } from '@/shared/db';
import { Button, Input, Label, NativeSelect, NativeSelectOption } from 'shonk-ui';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  activityOptions,
  calcTarget,
  goalOptions,
  isWithinLimits,
  saveProfile,
  sexOptions,
} from '@/entities/profile';
import { formatNumber } from '@/shared/lib';

const router = useRouter();

const form = reactive({
  sex: 'male' as Sex,
  age: '',
  heightCm: '',
  weightKg: '',
  activity: 'moderate' as ActivityLevel,
  goal: 'cutMild' as Goal,
});

const measurements = computed<CalcInput | null>(() => {
  const candidate = {
    sex: form.sex,
    age: Number(form.age),
    heightCm: Number(form.heightCm),
    weightKg: Number(form.weightKg),
    activity: form.activity,
    goal: form.goal,
  };

  const filled = [candidate.age, candidate.heightCm, candidate.weightKg].every(Number.isFinite);

  return filled && isWithinLimits(candidate) ? candidate : null;
});

const breakdown = computed(() => (measurements.value ? calcTarget(measurements.value) : null));

const activityHint = computed(() => activityOptions.find(option => option.id === form.activity)?.hint);
const goalHint = computed(() => goalOptions.find(option => option.id === form.goal)?.hint);

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
  <main class="flex-1 px-4 pt-8 pb-8">
    <h1 class="text-2xl font-semibold text-text-primary">
      Норма калорий
    </h1>
    <p class="mt-1 text-sm text-text-secondary">
      Считаем один раз. Потом можно поменять в настройках.
    </p>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <Label>Пол</Label>
        <div class="grid grid-cols-2 gap-2">
          <Button
            v-for="option in sexOptions"
            :key="option.id"
            type="button"
            :variant="form.sex === option.id ? 'default' : 'outline'"
            @click="form.sex = option.id"
          >
            {{ option.name }}
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="flex flex-col gap-2">
          <Label for="age">Возраст</Label>
          <Input id="age" v-model="form.age" inputmode="numeric" placeholder="30" />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="height">Рост, см</Label>
          <Input id="height" v-model="form.heightCm" inputmode="numeric" placeholder="180" />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="weight">Вес, кг</Label>
          <Input id="weight" v-model="form.weightKg" inputmode="numeric" placeholder="85" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <Label>Активность</Label>
        <NativeSelect v-model="form.activity">
          <NativeSelectOption v-for="option in activityOptions" :key="option.id" :value="option.id">
            {{ option.name }}
          </NativeSelectOption>
        </NativeSelect>
        <p class="text-xs text-text-tertiary">
          {{ activityHint }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <Label>Цель</Label>
        <NativeSelect v-model="form.goal">
          <NativeSelectOption v-for="option in goalOptions" :key="option.id" :value="option.id">
            {{ option.name }}
          </NativeSelectOption>
        </NativeSelect>
        <p class="text-xs text-text-tertiary">
          {{ goalHint }}
        </p>
      </div>

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
