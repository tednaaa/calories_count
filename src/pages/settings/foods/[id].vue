<script setup lang="ts">
import type { CustomFood } from '@/shared/db';
import { ChevronLeft } from '@lucide/vue';
import { Button, toast, useConfirm } from 'shonk-ui';
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  CustomFoodFields,
  draftFromCustomFood,
  draftToCustomFood,
  emptyCustomDraft,
  loadCustomFood,
  removeCustomFood,
  saveCustomFood,
} from '@/entities/food';

const route = useRoute('/settings/foods/[id]');
const router = useRouter();
const confirmation = useConfirm();

const food = ref<CustomFood>();
const draft = ref(emptyCustomDraft());
const saving = ref(false);

const input = computed(() => draftToCustomFood(draft.value));

onMounted(async () => {
  const stored = await loadCustomFood(route.params.id);

  if (!stored) {
    await router.replace('/settings/foods');
    return;
  }

  food.value = stored;
  draft.value = draftFromCustomFood(stored);
});

async function submit() {
  const current = food.value;
  const next = input.value;

  if (!current || !next || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await saveCustomFood(current, next);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast('Блюдо сохранено');
  await router.push('/settings/foods');
}

async function remove(id: string) {
  await removeCustomFood(id);
  toast('Блюдо удалено');
  await router.push('/settings/foods');
}

function askToRemove() {
  const current = food.value;

  if (!current) {
    return;
  }

  confirmation.require({
    message: `«${current.name}» пропадёт из выбора. Записи в дневнике останутся: название и калорийность в них свои, изменится только миниатюра — вместо фотографии будет первая буква.`,
    acceptLabel: 'Удалить',
    accept: () => {
      void remove(current.id);
    },
  });
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
        <ChevronLeft class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-text-primary">
        Своё блюдо
      </h1>
    </header>

    <p class="mt-1 text-sm text-text-secondary">
      Правка меняет только будущие записи — прошлые хранят своё название и свою калорийность.
    </p>

    <form v-if="food" class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <CustomFoodFields
        v-model:name="draft.name"
        v-model:kcal="draft.kcal"
        v-model:photo="draft.photo"
      />

      <Button type="submit" size="lg" :disabled="!input" :loading="saving">
        Сохранить
      </Button>

      <Button type="button" variant="destructive" @click="askToRemove">
        Удалить блюдо
      </Button>
    </form>
  </main>
</template>
