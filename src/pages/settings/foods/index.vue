<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@lucide/vue';
import { Button } from 'shonk-ui';
import { RouterLink } from 'vue-router';
import { FoodThumb, formatServing, useCustomFoods } from '@/entities/food';

const customFoods = useCustomFoods();
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <header class="flex items-center gap-1">
      <RouterLink
        to="/settings"
        class="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground"
        aria-label="Назад к настройкам"
      >
        <ChevronLeftIcon class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-foreground">
        Свои блюда
      </h1>
    </header>

    <p class="mt-1 text-sm text-muted-foreground">
      Заводятся прямо с телефона и живут только на нём. В сетке «Добавить» лежат отдельным блоком «Своё».
    </p>

    <ul v-if="customFoods.length" class="mt-6 border-t border-border">
      <li v-for="food in customFoods" :key="food.id" class="border-b border-border">
        <RouterLink :to="`/settings/foods/${food.id}`" class="flex items-center gap-3 py-3">
          <FoodThumb :photo="food.photo" :name="food.name" class="size-11" />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-foreground">
              {{ food.name }}
            </p>
            <p class="text-xs tabular-nums text-muted-foreground">
              {{ formatServing(food.kcal, food.amount, food.unit) }}
            </p>
          </div>

          <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
        </RouterLink>
      </li>
    </ul>

    <p v-else class="mt-6 text-sm text-muted-foreground">
      Пока пусто. Первое блюдо проще всего завести прямо во время еды — кнопкой «Новое» на экране «Добавить».
    </p>

    <Button :as="RouterLink" to="/settings/foods/new" variant="outline" class="mt-6 w-full">
      <PlusIcon class="size-4" />
      Добавить блюдо
    </Button>
  </main>
</template>
