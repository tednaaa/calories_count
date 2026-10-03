<script setup lang="ts">
import type { ActivityLevel, Goal, Sex } from '@/shared/db';
import { Button, Input, Label, NativeSelect, NativeSelectOption } from 'shonk-ui';
import { computed } from 'vue';
import { parseKg } from '@/shared/lib';
import { parseTargetWeight } from '../lib/draft';
import { activityOptions, goalOptions, sexOptions } from '../lib/options';
import { targetConflict } from '../lib/weight-goal';

const sex = defineModel<Sex>('sex', { required: true });
const age = defineModel<string>('age', { required: true });
const heightCm = defineModel<string>('heightCm', { required: true });
const weightKg = defineModel<string>('weightKg', { required: true });
const targetWeightKg = defineModel<string>('targetWeightKg', { required: true });
const activity = defineModel<ActivityLevel>('activity', { required: true });
const goal = defineModel<Goal>('goal', { required: true });

const activityHint = computed(() => activityOptions.find(option => option.id === activity.value)?.hint);
const goalHint = computed(() => goalOptions.find(option => option.id === goal.value)?.hint);

const target = computed(() => parseTargetWeight(targetWeightKg.value));

const targetHint = computed(() => {
  const current = parseKg(weightKg.value);

  if (target.value === null) {
    return 'Целевой вес — число от 30 до 300 кг.';
  }

  return target.value && current ? targetConflict(goal.value, current, target.value) : null;
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <Label>Пол</Label>
      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="option in sexOptions"
          :key="option.id"
          type="button"
          :variant="sex === option.id ? 'default' : 'secondary'"
          @click="sex = option.id"
        >
          {{ option.name }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="flex flex-col gap-2">
        <Label for="age">Возраст</Label>
        <Input id="age" v-model="age" inputmode="numeric" placeholder="30" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="height">Рост, см</Label>
        <Input id="height" v-model="heightCm" inputmode="numeric" placeholder="180" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="weight">Вес, кг</Label>
        <Input id="weight" v-model="weightKg" inputmode="decimal" placeholder="85" />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <Label>Активность</Label>
      <NativeSelect v-model="activity">
        <NativeSelectOption v-for="option in activityOptions" :key="option.id" :value="option.id">
          {{ option.name }}
        </NativeSelectOption>
      </NativeSelect>
      <p class="text-xs text-muted-foreground">
        {{ activityHint }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label>Цель</Label>
      <NativeSelect v-model="goal">
        <NativeSelectOption v-for="option in goalOptions" :key="option.id" :value="option.id">
          {{ option.name }}
        </NativeSelectOption>
      </NativeSelect>
      <p class="text-xs text-muted-foreground">
        {{ goalHint }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="target-weight">Целевой вес, кг</Label>
      <Input id="target-weight" v-model="targetWeightKg" inputmode="decimal" placeholder="Необязательно" :invalid="target === null" />
      <p v-if="targetHint" class="text-xs text-warning">
        {{ targetHint }}
      </p>
      <p v-else class="text-xs text-muted-foreground">
        Без срока — на статистике будет видно, сколько осталось.
      </p>
    </div>
  </div>
</template>
