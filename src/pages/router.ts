import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import { loadProfile } from '@/entities/profile';
import { redirectFor } from './guard';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const profile = await loadProfile();

  return redirectFor(Boolean(profile), to.path) ?? true;
});
