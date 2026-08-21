<script setup lang="ts">
import { Camera } from '@lucide/vue';
import { buttonVariants, Input, Label, toast } from 'shonk-ui';
import { readPhoto } from '@/shared/lib';
import FoodThumb from './FoodThumb.vue';

const props = defineProps<{ foodId?: string }>();

const name = defineModel<string>('name', { required: true });
const kcal = defineModel<string>('kcal', { required: true });
const photo = defineModel<string>('photo', { required: true });

async function pickPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) {
    return;
  }

  try {
    photo.value = await readPhoto(file);
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
      <Input id="custom-name" v-model="name" placeholder="Пирог у бабушки" />
    </div>

    <div class="flex flex-col gap-2">
      <Label for="custom-kcal">Калорийность порции, ккал</Label>
      <Input id="custom-kcal" v-model="kcal" inputmode="numeric" placeholder="350" />
    </div>

    <div class="flex flex-col gap-2">
      <Label>Фото</Label>

      <div class="flex items-center gap-3">
        <FoodThumb :food-id="props.foodId" :photo="photo" :name="name" class="size-16" />

        <div class="flex flex-col items-start gap-2">
          <label :class="buttonVariants({ variant: 'outline', size: 'sm' })">
            <Camera class="size-4" />
            {{ photo ? 'Заменить' : 'Снять или выбрать' }}
            <input type="file" accept="image/*" class="sr-only" @change="pickPhoto">
          </label>

          <button
            v-if="photo"
            type="button"
            class="text-xs text-text-secondary"
            @click="photo = ''"
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
