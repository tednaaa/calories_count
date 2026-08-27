<script setup lang="ts">
import type { CustomDraft, ServingId } from '../lib/custom-draft';
import { CameraIcon } from '@lucide/vue';
import {
  buttonVariants,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from 'shonk-ui';
import { computed } from 'vue';
import { readPhoto } from '@/shared/lib';
import { draftToServing, servings } from '../lib/custom-draft';
import { formatServing } from '../lib/serving';
import FoodThumb from './FoodThumb.vue';

const props = defineProps<{ foodId?: string }>();

const draft = defineModel<CustomDraft>({ required: true });

const weighed = computed(() => draft.value.serving !== 'portion');
const portion = computed(() => draftToServing(draft.value));

function chooseServing(id: unknown) {
  draft.value.serving = id as ServingId;
}

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
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <Label for="custom-name">Название</Label>
      <Input id="custom-name" v-model="draft.name" placeholder="Пирог у бабушки" />
    </div>

    <div class="flex flex-col gap-2">
      <Label for="custom-kcal">Калорийность</Label>

      <Tabs :model-value="draft.serving" @update:model-value="chooseServing">
        <TabsList class="w-full">
          <TabsTrigger v-for="option in servings" :key="option.id" :value="option.id">
            {{ option.name }}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div class="flex items-center gap-2">
        <InputGroup v-if="draft.serving === 'custom'" class="w-28 shrink-0">
          <InputGroupInput
            v-model="draft.grams"
            inputmode="numeric"
            placeholder="30"
            aria-label="Базовый вес"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>г</InputGroupText>
          </InputGroupAddon>
        </InputGroup>

        <InputGroup class="min-w-0 flex-1">
          <InputGroupInput id="custom-kcal" v-model="draft.kcal" inputmode="numeric" placeholder="270" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>ккал</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>

    <div v-if="weighed" class="flex flex-col gap-2">
      <Label for="custom-portion">Вес порции</Label>

      <InputGroup>
        <InputGroupInput id="custom-portion" v-model="draft.portion" inputmode="numeric" placeholder="130" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>г</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <p class="text-xs text-text-tertiary">
        <template v-if="portion?.grams === undefined">
          Сколько весит то, что кладёшь в день. Пусто — значит порция равна базовому весу.
        </template>
        <template v-else>
          Одна порция — {{ formatServing(portion.kcal, portion.grams) }}
        </template>
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label>Фото</Label>

      <div class="flex items-center gap-3">
        <FoodThumb :food-id="props.foodId" :photo="draft.photo" :name="draft.name" zoomable class="size-16" />

        <div class="flex flex-col items-start gap-2">
          <label :class="buttonVariants({ variant: 'outline', size: 'sm' })">
            <CameraIcon class="size-4" />
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
        Необязательно. Снимок уменьшается до 400 px и хранится прямо в базе.
      </p>
    </div>
  </div>
</template>
