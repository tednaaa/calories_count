<script setup lang="ts">
import { Camera, ChevronLeft } from '@lucide/vue';
import { Badge, Button, buttonVariants, Input, Label, toast } from 'shonk-ui';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { addCustomEntry } from '@/entities/entry';
import { FoodThumb } from '@/entities/food';
import { formatDayLabel, isToday, readPhoto, requestedDateKey } from '@/shared/lib';
import { draftToCustomItem, emptyCustomDraft } from './lib/custom';

const route = useRoute();
const router = useRouter();

const draft = ref(emptyCustomDraft());
const saving = ref(false);

const dateKey = computed(() => requestedDateKey(route.query.date));
const showsToday = computed(() => isToday(dateKey.value));
const dayQuery = computed(() => (showsToday.value ? {} : { date: dateKey.value }));
const item = computed(() => draftToCustomItem(draft.value));

async function pickPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) {
    return;
  }

  try {
    draft.value.photo = await readPhoto(file);
  }
  catch (error) {
    console.error('[pickPhoto]', error);
    toast('Не удалось прочитать фото');
  }
}

async function submit() {
  if (!item.value || saving.value) {
    return;
  }

  saving.value = true;

  try {
    await addCustomEntry(dateKey.value, item.value);
  }
  catch (error) {
    console.error('[submit]', error);
    saving.value = false;
    toast('Не удалось сохранить, попробуй ещё раз');
    return;
  }

  toast(`Добавлено: ${item.value.name}`);
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

    <p class="mt-1 text-sm text-text-secondary">
      Разовая запись — попадёт в день, но не в каталог.
    </p>

    <div v-if="!showsToday" class="mt-3 flex items-center gap-2">
      <Badge variant="secondary">
        {{ formatDayLabel(dateKey) }}
      </Badge>
      <span class="text-xs text-text-tertiary">запись задним числом</span>
    </div>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <Label for="custom-name">Название</Label>
        <Input id="custom-name" v-model="draft.name" placeholder="Пирог у бабушки" />
      </div>

      <div class="flex flex-col gap-2">
        <Label for="custom-kcal">Калорийность, ккал</Label>
        <Input id="custom-kcal" v-model="draft.kcal" inputmode="numeric" placeholder="350" />
      </div>

      <div class="flex flex-col gap-2">
        <Label>Фото</Label>

        <div class="flex items-center gap-3">
          <FoodThumb :photo="draft.photo" :name="draft.name" class="size-16" />

          <div class="flex flex-col items-start gap-2">
            <label :class="buttonVariants({ variant: 'outline', size: 'sm' })">
              <Camera class="size-4" />
              {{ draft.photo ? 'Заменить' : 'Снять или выбрать' }}
              <input type="file" accept="image/*" class="sr-only" @change="pickPhoto">
            </label>

            <button
              v-if="draft.photo"
              type="button"
              class="text-xs text-text-secondary"
              @click="draft.photo = ''"
            >
              Убрать фото
            </button>
          </div>
        </div>

        <p class="text-xs text-text-tertiary">
          Необязательно. Снимок уменьшается до 400 px и хранится вместе с записью.
        </p>
      </div>

      <Button type="submit" size="lg" :disabled="!item" :loading="saving">
        Добавить в день
      </Button>
    </form>
  </main>
</template>
