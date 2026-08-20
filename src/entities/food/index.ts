export { activeFoods, foodById, foods, matchesQuery, photoUrl, searchFoods } from './lib/catalog';
export type { CategoryId } from './lib/categories';
export { categories, categoryName } from './lib/categories';
export type { CustomDraft } from './lib/custom-draft';
export {
  draftFromCustomFood,
  draftToCustomFood,
  emptyCustomDraft,
  MAX_KCAL,
  MIN_KCAL,
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
export type { Food, Portion } from './lib/types';
export { useCustomFoods } from './lib/use-custom-foods';
export { default as CustomFoodFields } from './ui/CustomFoodFields.vue';
export { default as FoodThumb } from './ui/FoodThumb.vue';
