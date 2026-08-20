<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue';
import { Badge, Button, Switch, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { CustomFoodFields, draftToCustomFood, emptyCustomDraft } from '@/entities/food';
import { formatDayLabel, isToday, requestedDateKey } from '@/shared/lib';
import { addCustomFoodToDay, addCustomOnceToDay } from './lib/custom';

const route = useRoute();
const router = useRouter();

const draft = ref(emptyCustomDraft());
const saves = ref(false);
const saving = ref(false);

const dateKey = computed(() => requestedDateKey(route.query.date));
const showsToday = computed(() => isToday(dateKey.value));
const dayQuery = computed(() => (showsToday.value ? {} : { date: dateKey.value }));
const input = computed(() => draftToCustomFood(draft.value));

const savesHint = computed(() => (saves.value
  ? 'Появится в сетке «Добавить» — в следующий раз хватит тапа по карточке.'
  : 'Разовая запись: попадёт в день и нигде больше не останется.'));

async function submit() {
  const food = input.value;

  if (!food || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await (saves.value ? addCustomFoodToDay : addCustomOnceToDay)(dateKey.value, food);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast(`Добавлено: ${food.name}`);
  await router.push({ path: '/', query: dayQuery.value });
}
</script>

<template>
  <main class="flex-1 px-4 pt-6 pb-6">
    <header class="flex items-center gap-1">
      <RouterLink
        :to="{ path: '/add', query: dayQuery }"
        class="-ml-2 flex size-10 items-center justify-center rounded-full text-text-secondary"
        aria-label="Назад к каталогу"
      >
        <ChevronLeft class="size-5" />
      </RouterLink>

      <h1 class="text-xl font-semibold text-text-primary">
        Своё блюдо
      </h1>
    </header>

    <div v-if="!showsToday" class="mt-3 flex items-center gap-2">
      <Badge variant="secondary">
        {{ formatDayLabel(dateKey) }}
      </Badge>
      <span class="text-xs text-text-tertiary">запись задним числом</span>
    </div>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <CustomFoodFields
        v-model:name="draft.name"
        v-model:kcal="draft.kcal"
        v-model:photo="draft.photo"
      />

      <div class="flex items-center gap-3 rounded-lg border border-border-default p-3">
        <button type="button" class="min-w-0 flex-1 text-left" @click="saves = !saves">
          <span class="text-sm text-text-primary">Оставить в «Своём»</span>
          <span class="mt-1 block text-xs text-text-tertiary">{{ savesHint }}</span>
        </button>

        <Switch id="custom-saves" v-model="saves" />
      </div>

      <Button type="submit" size="lg" :disabled="!input" :loading="saving">
        Добавить в день
      </Button>
    </form>
  </main>
</template>
