<script setup lang="ts">
import type { WeightRecord } from '@/shared/db';
import { Button } from 'shonk-ui';
import { ref } from 'vue';
import { lastWeight } from '@/entities/weight';
import { formatDayLabel, formatKg, useLiveQuery } from '@/shared/lib';
import { WeighInDialog } from '@/widgets/weigh-in';

const latest = useLiveQuery<WeightRecord | undefined>(() => lastWeight(), undefined);

const weighing = ref(false);
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold text-foreground">
      Вес
    </h2>

    <div class="flex items-end justify-between gap-4 pt-4">
      <div v-if="latest">
        <p class="text-lg tabular-nums text-foreground">
          {{ formatKg(latest.kg) }} кг
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatDayLabel(latest.date) }}
        </p>
      </div>
      <p v-else class="text-sm text-muted-foreground">
        Взвешиваний пока нет
      </p>

      <Button type="button" @click="weighing = true">
        Записать вес
      </Button>
    </div>

    <WeighInDialog v-model:open="weighing" :last-kg="latest?.kg" />
  </section>
</template>
