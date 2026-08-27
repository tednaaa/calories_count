export type { Lookup, Package, Product } from './lib/barcode';
export { isBarcode, lookupBarcode, parsePackage, productToDraft } from './lib/barcode';
export { activeFoods, foodById, foods, matchesQuery, photoUrl, searchFoods } from './lib/catalog';
export type { CategoryId } from './lib/categories';
export { categories, categoryName } from './lib/categories';
export type { CustomDraft, Serving, ServingId } from './lib/custom-draft';
export {
  draftFromCustomFood,
  draftToCustomFood,
  draftToServing,
  emptyCustomDraft,
  HUNDRED,
  MAX_AMOUNT,
  MAX_KCAL,
  MIN_AMOUNT,
  MIN_KCAL,
  servingOptions,
  servingToDraft,
  units,
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
export type { NutrientId } from './lib/nutrients';
export { formatNutrient, nutrientNames, portionNutrients, scaleNutrients, sumNutrients } from './lib/nutrients';
export { formatAmount, formatServing, portionKcal, unitName } from './lib/serving';
export type { Food, Portion } from './lib/types';
export { useCustomFoods } from './lib/use-custom-foods';
export { default as CustomFoodFields } from './ui/CustomFoodFields.vue';
export { default as FoodThumb } from './ui/FoodThumb.vue';
export { default as NutrientStrip } from './ui/NutrientStrip.vue';
