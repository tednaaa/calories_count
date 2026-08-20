<script setup lang="ts">
import type { Profile } from '@/shared/db';
import { loadProfile } from '@/entities/profile';
import { useLiveQuery } from '@/shared/lib';
import AboutSection from './ui/AboutSection.vue';
import CustomFoodsSection from './ui/CustomFoodsSection.vue';
import DataSection from './ui/DataSection.vue';
import ProfileSection from './ui/ProfileSection.vue';
import TargetSection from './ui/TargetSection.vue';

const profile = useLiveQuery<Profile | undefined>(() => loadProfile(), undefined);
</script>

<template>
  <main class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
    <h1 class="text-xl font-semibold text-text-primary">
      Настройки
    </h1>

    <template v-if="profile">
      <section class="pt-8">
        <h2 class="pb-4 text-xs font-medium tracking-wide text-text-tertiary uppercase">
          Норма
        </h2>
        <TargetSection :profile="profile" />
      </section>

      <section class="pt-8">
        <h2 class="pb-4 text-xs font-medium tracking-wide text-text-tertiary uppercase">
          Профиль
        </h2>
        <ProfileSection :profile="profile" />
      </section>
    </template>

    <section class="pt-8">
      <h2 class="pb-4 text-xs font-medium tracking-wide text-text-tertiary uppercase">
        Свои блюда
      </h2>
      <CustomFoodsSection />
    </section>

    <section class="pt-8">
      <h2 class="pb-4 text-xs font-medium tracking-wide text-text-tertiary uppercase">
        Данные
      </h2>
      <DataSection />
    </section>

    <section class="pt-8">
      <h2 class="pb-4 text-xs font-medium tracking-wide text-text-tertiary uppercase">
        О приложении
      </h2>
      <AboutSection />
    </section>
  </main>
</template>
