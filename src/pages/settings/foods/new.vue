<script setup lang="ts">
import { ChevronLeftIcon } from '@lucide/vue';
import { Button, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { createCustomFood, CustomFoodFields, draftToCustomFood, emptyCustomDraft } from '@/entities/food';

const router = useRouter();

const draft = ref(emptyCustomDraft());
const saving = ref(false);

const input = computed(() => draftToCustomFood(draft.value));

async function submit() {
  const food = input.value;

  if (!food || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await createCustomFood(food);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast(`Блюдо добавлено: ${food.name}`);
  await router.push('/settings/foods');
}
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <header class="flex items-center gap-1">
      <RouterLink
        to="/settings/foods"
        class="-ml-2 flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Назад к своим блюдам"
      >
        <ChevronLeftIcon class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-text-primary">
        Новое блюдо
      </h1>
    </header>

    <p class="mt-1 text-sm text-text-secondary">
      Появится в сетке «Добавить». В дневник ничего не запишется.
    </p>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <CustomFoodFields v-model="draft" />

      <Button type="submit" size="lg" :disabled="!input" :loading="saving">
        Сохранить
      </Button>
    </form>
  </main>
</template>
