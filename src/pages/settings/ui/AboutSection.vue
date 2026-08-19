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
        <dt class="text-text-tertiary">
          Версия
        </dt>
        <dd class="tabular-nums text-text-primary">
          {{ version }}
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-text-tertiary">
          Собрано
        </dt>
        <dd class="text-right text-text-primary">
          {{ builtAt }}
        </dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-text-tertiary">
          Блюд в каталоге
        </dt>
        <dd class="tabular-nums text-text-primary">
          {{ catalogSize }}
        </dd>
      </div>
    </dl>

    <div class="rounded-lg border border-border-default bg-bg-subtle p-4">
      <p class="text-sm font-medium text-text-primary">
        Установка на iPhone
      </p>
      <p class="mt-1 text-xs text-text-secondary">
        Safari не предлагает установку сам: открой сайт в Safari, нажми «Поделиться» и выбери «На экран „Домой“».
      </p>
    </div>
  </div>
</template>
