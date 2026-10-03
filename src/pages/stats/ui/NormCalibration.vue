<script setup lang="ts">
import type { CalibrationOffer } from '../lib/calibration';
import type { Impact } from '../lib/impact';
import type { Goal } from '@/shared/db';
import { Button, toast } from 'shonk-ui';
import { computed } from 'vue';
import { applyCalibration, CALIBRATION_STEP_KCAL, goalOptions } from '@/entities/profile';
import { formatNumber, pluralize } from '@/shared/lib';
import { formatKcal, formatRate } from '../lib/impact';

const props = defineProps<{
  offer: CalibrationOffer;
  impact: Impact;
  estimatedTdee: number;
  goal: Goal;
}>();

const goalName = computed(() => goalOptions.find(option => option.id === props.goal)?.name ?? '');

const headline = computed(() => {
  const gap = props.impact.realTdee - props.estimatedTdee;
  const direction = gap < 0 ? 'меньше' : 'больше';

  return `Вес показывает, что вы тратите на ${formatKcal(Math.abs(gap))} ккал ${direction}, чем по расчёту. Норму можно уточнить.`;
});

const waitNote = computed(() => {
  switch (props.offer.kind) {
    case 'early':
      return `Уточнить норму можно будет через ${props.offer.daysLeft} ${pluralize(props.offer.daysLeft, ['день', 'дня', 'дней'])} — первые недели вес уходит вместе с водой.`;
    case 'recent':
      return `Норма уточнена. Следующее уточнение — через ${props.offer.daysLeft} ${pluralize(props.offer.daysLeft, ['день', 'дня', 'дней'])}, когда вес покажет месяц на новой норме.`;
    case 'fewWeighIns':
      return `Ещё ${props.offer.missing} ${pluralize(props.offer.missing, ['взвешивание', 'взвешивания', 'взвешиваний'])} — и можно уточнить норму.`;
    case 'patchyFood':
      return 'Уточнить норму можно, когда еда записана хотя бы за 70 % дней.';
    case 'precise':
      return 'Норма уже точная — расчёт и вес сходятся.';
    case 'atMinimum':
      return 'Норма уже на безопасном минимуме, ниже не опускаем.';
    default:
      return '';
  }
});

async function apply(tdeeCorrectionKcal: number) {
  await applyCalibration(tdeeCorrectionKcal);
  toast('Норма уточнена');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <template v-if="props.offer.kind === 'offer'">
      <p class="text-sm text-foreground">
        {{ headline }}
      </p>

      <Button type="button" @click="apply(props.offer.tdeeCorrectionKcal)">
        Поставить {{ formatNumber(props.offer.next) }} ккал
      </Button>
    </template>

    <p v-else class="text-sm text-muted-foreground">
      {{ waitNote }}
    </p>

    <details class="text-xs text-muted-foreground">
      <summary class="cursor-pointer text-foreground">
        Почему это работает
      </summary>
      <div class="flex flex-col gap-2 pt-2">
        <ul v-if="props.offer.kind === 'offer'" class="flex flex-col gap-1 text-foreground">
          <li>
            Вы ели в среднем {{ formatKcal(props.impact.averageIntake) }} ккал, вес шёл {{ formatRate(props.impact.actualPerWeek) }},
            а расчёт ждал {{ formatRate(props.impact.expectedPerWeek) }}.
          </li>
          <li>
            Значит, ваш реальный расход ≈ {{ formatKcal(props.impact.realTdee) }} ккал, а не {{ formatKcal(props.estimatedTdee) }}, как считалось.
          </li>
          <li>
            Для цели «{{ goalName }}» норма — {{ formatNumber(props.offer.ideal) }} ккал. Уточнять можно раз в месяц.
          </li>
          <li v-if="props.offer.next !== props.offer.ideal">
            За раз норма сдвигается не больше чем на {{ CALIBRATION_STEP_KCAL }} ккал — сейчас {{ formatNumber(props.offer.next) }},
            остальное при следующем уточнении.
          </li>
        </ul>
        <p>
          Килограмм жира — около 7700 ккал. Если вес идёт медленнее, чем обещает съеденное, значит, вы тратите меньше,
          чем думает формула, и наоборот. Формула угадывает расход по полу, возрасту и активности, а вес показывает, что происходит на самом деле.
        </p>
        <p>
          Сравнение идёт по вашим же записям, поэтому привычка всегда недописывать еду гасится сама: норма получается в тех калориях,
          в которых вы записываете. Сбивают расчёт только пропуски и дни, записанные наполовину.
        </p>
        <p>
          Первые одну–две недели диеты вес уходит быстрее из-за воды, поэтому уточнение появляется не раньше чем через 14 дней.
          При долгой диете расход понемногу снижается, поэтому уточнение доступно раз в месяц: за это время вес успевает показать, как работает новая норма.
        </p>
      </div>
    </details>
  </div>
</template>
