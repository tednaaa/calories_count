import type { Ref } from 'vue';
import type { CustomFood } from '@/shared/db';
import { useLiveQuery } from '@/shared/lib';
import { listCustomFoods } from './custom-food';

export function useCustomFoods(): Ref<CustomFood[]> {
  return useLiveQuery<CustomFood[]>(() => listCustomFoods(), []);
}
