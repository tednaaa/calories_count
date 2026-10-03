<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { Button, Input, toast } from 'shonk-ui';
import { computed, ref, watch } from 'vue';
import { calcTarget, resetCalibration, resetTargetToCalculated, setManualTarget } from '@/entities/profile';
import { formatNumber } from '@/shared/lib';

const props = defineProps<{ profile: Profile }>();
const MIN_TARGET = 800;
const MAX_TARGET = 6000;

const manual = ref(String(props.profile.targetKcal));

watch(() => props.profile.targetKcal, (next) => {
  manual.value = String(next);
});

const calculated = computed(() => calcTarget(props.profile).target);

const origin = computed(() => {
  if (props.profile.targetOverridden) {
    return 'Задана вручную';
  }

  return props.profile.calibratedAt ? 'Посчитана по профилю и уточнена по весу' : 'Посчитана по профилю';
});

const correctionNote = computed(() => {
  const correction = props.profile.tdeeCorrectionKcal ?? 0;
  const direction = correction < 0 ? 'ниже' : 'выше';

  return `Ваш расход по весу на ${formatNumber(Math.abs(correction))} ккал ${direction} формулы, это учтено в расчёте.`;
});

const entered = computed(() => {
  const value = Number(manual.value);

  return Number.isInteger(value) && value >= MIN_TARGET && value <= MAX_TARGET ? value : null;
});

const changed = computed(() => entered.value !== null && entered.value !== props.profile.targetKcal);

async function apply() {
  if (entered.value === null) {
    return;
  }

  await setManualTarget(entered.value);
  toast('Норма задана вручную');
}

async function forgetCalibration() {
  await resetCalibration();
  toast('Уточнение сброшено');
}

async function reset() {
  await resetTargetToCalculated();
  toast('Вернули расчётную норму');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-3xl font-semibold tabular-nums text-foreground">
      {{ formatNumber(props.profile.targetKcal) }}
      <span class="text-base font-normal text-muted-foreground">ккал в день</span>
    </p>

    <p class="text-xs text-muted-foreground">
      {{ origin }}. Расчёт по профилю сейчас даёт {{ formatNumber(calculated) }} ккал.
    </p>

    <p v-if="props.profile.calibratedAt" class="text-xs text-muted-foreground">
      {{ correctionNote }}
    </p>

    <div class="flex items-end gap-2">
      <Input id="target" v-model="manual" inputmode="numeric" :invalid="entered === null" class="flex-1" />
      <Button type="button" :disabled="!changed" @click="apply">
        Задать
      </Button>
    </div>

    <p v-if="entered === null" class="text-xs text-warning">
      Норма должна быть целым числом от {{ formatNumber(MIN_TARGET) }} до {{ formatNumber(MAX_TARGET) }} ккал.
    </p>

    <Button
      v-if="props.profile.targetOverridden"
      type="button"
      variant="secondary"
      @click="reset"
    >
      Вернуть расчётную
    </Button>

    <Button
      v-if="props.profile.calibratedAt"
      type="button"
      variant="secondary"
      @click="forgetCalibration"
    >
      Сбросить уточнение
    </Button>
  </div>
</template>
