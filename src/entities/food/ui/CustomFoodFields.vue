<script setup lang="ts">
import type { CustomDraft, ServingId } from '../lib/custom-draft';
import type { Unit } from '@/shared/db';
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
import { draftToServing, servingOptions, units } from '../lib/custom-draft';
import { formatServing, unitName } from '../lib/serving';
import FoodThumb from './FoodThumb.vue';
import NutrientStrip from './NutrientStrip.vue';

const props = defineProps<{ foodId?: string; busy?: boolean }>();

const draft = defineModel<CustomDraft>({ required: true });

const weighed = computed(() => draft.value.serving !== 'portion');
const portion = computed(() => draftToServing(draft.value));
const servings = computed(() => servingOptions(draft.value.unit));
const poured = computed(() => draft.value.unit === 'ml');
const measure = computed(() => unitName(draft.value.unit));
const baseLabel = computed(() => (poured.value ? 'Базовый объём' : 'Базовый вес'));
const portionLabel = computed(() => (poured.value ? 'Объём порции' : 'Вес порции'));
const portionHint = computed(() => (poured.value
  ? 'Сколько наливаешь за раз. Пусто — значит порция равна базовому объёму.'
  : 'Сколько весит то, что кладёшь в день. Пусто — значит порция равна базовому весу.'));

function chooseServing(id: unknown) {
  draft.value.serving = id as ServingId;
}

function chooseUnit(id: unknown) {
  draft.value.unit = id as Unit;
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

      <p v-if="props.busy" class="text-xs text-muted-foreground">
        Спрашиваю базу продуктов по штрих-коду…
      </p>
      <p v-else-if="draft.barcode" class="text-xs text-muted-foreground">
        Штрих-код {{ draft.barcode }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <Label for="custom-kcal">Калорийность</Label>

        <Tabs v-if="weighed" :model-value="draft.unit" @update:model-value="chooseUnit">
          <TabsList>
            <TabsTrigger v-for="option in units" :key="option.id" :value="option.id" class="px-3">
              {{ option.name }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
            v-model="draft.amount"
            inputmode="numeric"
            placeholder="30"
            :aria-label="baseLabel"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ measure }}</InputGroupText>
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
      <Label for="custom-portion">{{ portionLabel }}</Label>

      <InputGroup>
        <InputGroupInput id="custom-portion" v-model="draft.portion" inputmode="numeric" placeholder="130" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{{ measure }}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <p class="text-xs text-muted-foreground">
        <template v-if="portion?.amount === undefined">
          {{ portionHint }}
        </template>
        <template v-else>
          Одна порция — {{ formatServing(portion.kcal, portion.amount, portion.unit) }}
        </template>
      </p>
    </div>

    <NutrientStrip :nutrients="portion?.nutrients" :grades="draft.grades" />

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
            class="text-xs text-muted-foreground"
            @click="draft.photo = ''"
          >
            Убрать фото
          </button>
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        Необязательно. Снимок уменьшается до 400 px и хранится прямо в базе.
      </p>
    </div>
  </div>
</template>
