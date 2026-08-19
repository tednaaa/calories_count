<script setup lang="ts">
import type { ActivityLevel, Goal, Sex } from '@/shared/db';
import { Button, Input, Label, NativeSelect, NativeSelectOption } from 'shonk-ui';
import { computed } from 'vue';
import { activityOptions, goalOptions, sexOptions } from '../lib/options';

const sex = defineModel<Sex>('sex', { required: true });
const age = defineModel<string>('age', { required: true });
const heightCm = defineModel<string>('heightCm', { required: true });
const weightKg = defineModel<string>('weightKg', { required: true });
const activity = defineModel<ActivityLevel>('activity', { required: true });
const goal = defineModel<Goal>('goal', { required: true });

const activityHint = computed(() => activityOptions.find(option => option.id === activity.value)?.hint);
const goalHint = computed(() => goalOptions.find(option => option.id === goal.value)?.hint);
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
          :variant="sex === option.id ? 'default' : 'outline'"
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
        <Input id="weight" v-model="weightKg" inputmode="numeric" placeholder="85" />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <Label>Активность</Label>
      <NativeSelect v-model="activity">
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
      <NativeSelect v-model="goal">
        <NativeSelectOption v-for="option in goalOptions" :key="option.id" :value="option.id">
          {{ option.name }}
        </NativeSelectOption>
      </NativeSelect>
      <p class="text-xs text-text-tertiary">
        {{ goalHint }}
      </p>
    </div>
  </div>
</template>
