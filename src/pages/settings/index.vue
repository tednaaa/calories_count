<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';
import { useCustomFoods } from '@/entities/food';
import { loadProfile } from '@/entities/profile';
import { formatNumber, useLiveQuery } from '@/shared/lib';
import { describeProfile, needsIosInstallHint, targetOrigin } from './lib/summary';
import ReminderSection from './ui/ReminderSection.vue';
import SettingsRow from './ui/SettingsRow.vue';

const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
const customFoods = useCustomFoods();

const standalone = useMediaQuery('(display-mode: standalone)');
const showsInstallHint = computed(() => needsIosInstallHint(navigator.userAgent, standalone.value));

const version = __APP_VERSION__;
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <h1 class="text-xl font-semibold text-foreground">
      Настройки
    </h1>

    <ul v-if="profile" class="mt-6 divide-y divide-border rounded-lg border border-border">
      <li>
        <SettingsRow
          to="/settings/target"
          title="Норма"
          :hint="targetOrigin(profile)"
          :value="`${formatNumber(profile.targetKcal)} ккал`"
        />
      </li>
      <li>
        <SettingsRow to="/settings/profile" title="Профиль" :hint="describeProfile(profile)" />
      </li>
    </ul>

    <ReminderSection class="mt-4 rounded-lg border border-border px-4 py-3" />

    <ul class="mt-4 divide-y divide-border rounded-lg border border-border">
      <li>
        <SettingsRow
          to="/settings/foods"
          title="Свои блюда"
          hint="Добавить, поправить, удалить"
          :value="String(customFoods.length)"
        />
      </li>
      <li>
        <SettingsRow to="/settings/data" title="Данные" hint="Резервная копия и удаление" />
      </li>
      <li>
        <SettingsRow to="/settings/about" title="О приложении" :value="version" />
      </li>
    </ul>

    <div v-if="showsInstallHint" class="mt-6 rounded-lg border border-border bg-secondary p-4">
      <p class="text-sm font-medium text-foreground">
        Установка на iPhone
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        Safari не предлагает установку сам: открой сайт в Safari, нажми «Поделиться» и выбери «На экран „Домой“».
      </p>
    </div>
  </main>
</template>
