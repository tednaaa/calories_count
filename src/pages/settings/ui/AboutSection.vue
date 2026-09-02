<script setup lang="ts">
import { activeFoods } from '@/entities/food';

const version = __APP_VERSION__;
const builtAt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' })
  .format(new Date(__BUILD_DATE__));
const catalogSize = activeFoods.length;
</script>

<template>
  <div class="flex flex-col gap-4">
    <dl class="flex flex-col gap-2 text-sm">
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">
          Версия
        </dt>
        <dd class="tabular-nums text-foreground">
          {{ version }}
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">
          Собрано
        </dt>
        <dd class="text-right text-foreground">
          {{ builtAt }}
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-muted-foreground">
          Блюд в каталоге
        </dt>
        <dd class="tabular-nums text-foreground">
          {{ catalogSize }}
        </dd>
      </div>
    </dl>

    <div class="rounded-lg border border-border bg-secondary p-4">
      <p class="text-sm font-medium text-foreground">
        Установка на iPhone
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        Safari не предлагает установку сам: открой сайт в Safari, нажми «Поделиться» и выбери «На экран „Домой“».
      </p>
    </div>
  </div>
</template>
