<script setup lang="ts">
import { Button, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createCustomFood, CustomFoodFields, draftToCustomFood, emptyCustomDraft } from '@/entities/food';
import SettingsLayout from '../ui/SettingsLayout.vue';

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
  <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
    <SettingsLayout title="Новое блюдо" back="/settings/foods" back-label="Назад к своим блюдам">
      <p class="text-sm text-muted-foreground">
        Появится в сетке «Добавить». В дневник ничего не запишется.
      </p>

      <CustomFoodFields v-model="draft" class="mt-6" />

      <template #footer>
        <Button type="submit" size="lg" :disabled="!input" :loading="saving">
          Сохранить
        </Button>
      </template>
    </SettingsLayout>
  </form>
</template>
