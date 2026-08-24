<script setup lang="ts">
import type { Component } from 'vue';
import { ChartColumnIcon, HouseIcon, PlusIcon, SettingsIcon } from '@lucide/vue';
import { cn } from 'shonk-ui';
import { RouterLink } from 'vue-router';

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  accent?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Сегодня', icon: HouseIcon },
  { to: '/add', label: 'Добавить', icon: PlusIcon, accent: true },
  { to: '/stats', label: 'Статистика', icon: ChartColumnIcon },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon },
];
</script>

<template>
  <nav class="border-t border-border-default bg-bg-surface pb-[env(safe-area-inset-bottom)]">
    <ul class="grid grid-cols-4">
      <li v-for="item in items" :key="item.to">
        <RouterLink #default="{ href, navigate, isExactActive }" :to="item.to" custom>
          <a
            :href="href"
            :class="cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
              isExactActive ? 'text-text-brand' : 'text-text-secondary',
            )"
            @click="navigate"
          >
            <component
              :is="item.icon"
              :class="cn('size-5', item.accent && 'size-7 rounded-full bg-bg-brand p-1 text-text-inverse')"
            />
            {{ item.label }}
          </a>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
