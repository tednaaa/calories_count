import type { ActivityLevel, Goal, Sex } from '@/shared/db';

export const sexOptions: { id: Sex; name: string }[] = [
  { id: 'male', name: 'Мужской' },
  { id: 'female', name: 'Женский' },
];

export const activityOptions: { id: ActivityLevel; name: string; hint: string }[] = [
  { id: 'sedentary', name: 'Сидячий', hint: 'Офис, тренировок нет' },
  { id: 'light', name: 'Лёгкая активность', hint: 'Тренировки 1–3 раза в неделю' },
  { id: 'moderate', name: 'Умеренная', hint: 'Тренировки 3–5 раз в неделю' },
  { id: 'high', name: 'Высокая', hint: 'Тренировки 6–7 раз в неделю' },
  { id: 'veryHigh', name: 'Очень высокая', hint: 'Физическая работа или две тренировки в день' },
];

export const goalOptions: { id: Goal; name: string; hint: string }[] = [
  { id: 'cut', name: 'Похудение', hint: 'Около −0,5 кг в неделю' },
  { id: 'cutMild', name: 'Мягкое похудение', hint: 'Около −0,35 кг в неделю' },
  { id: 'maintain', name: 'Поддержание веса', hint: 'Столько же, сколько тратишь' },
  { id: 'bulkMild', name: 'Мягкий набор', hint: 'Около +0,2 кг в неделю' },
  { id: 'bulk', name: 'Набор массы', hint: 'Около +0,3 кг в неделю' },
];
