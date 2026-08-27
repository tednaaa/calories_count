export { activeFoods, foodById, foods, matchesQuery, photoUrl, searchFoods } from './lib/catalog';
export type { CategoryId } from './lib/categories';
export { categories, categoryName } from './lib/categories';
export type { CustomDraft, Serving, ServingId } from './lib/custom-draft';
export {
  draftFromCustomFood,
  draftToCustomFood,
  draftToServing,
  emptyCustomDraft,
  HUNDRED_GRAMS,
  MAX_GRAMS,
  MAX_KCAL,
  MIN_GRAMS,
  MIN_KCAL,
  servings,
  servingToDraft,
} from './lib/custom-draft';
export type { CustomFoodInput } from './lib/custom-food';
export {
  buildCustomFood,
  createCustomFood,
  listCustomFoods,
  loadCustomFood,
  nextCustomFood,
  photosById,
  removeCustomFood,
  saveCustomFood,
} from './lib/custom-food';
export { formatGrams, formatServing, portionKcal } from './lib/serving';
export type { Food, Portion } from './lib/types';
export { useCustomFoods } from './lib/use-custom-foods';
export { default as CustomFoodFields } from './ui/CustomFoodFields.vue';
export { default as FoodThumb } from './ui/FoodThumb.vue';
