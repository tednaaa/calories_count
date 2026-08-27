import type { DateKey } from '@/shared/lib';

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'veryHigh';
export type Goal = 'cut' | 'cutMild' | 'maintain' | 'bulkMild' | 'bulk';
export type Unit = 'g' | 'ml';
export type NutriScore = 'a' | 'b' | 'c' | 'd' | 'e';

export interface Nutrients {
  protein?: number;
  fat?: number;
  saturatedFat?: number;
  carbs?: number;
  sugars?: number;
  fiber?: number;
  salt?: number;
}

export interface Grades {
  nutriScore?: NutriScore;
  nova?: number;
}

export interface Basis {
  amount: number;
  kcal: number;
  nutrients?: Nutrients;
}

export interface Entry {
  id: string;
  date: DateKey;
  createdAt: number;
  foodId?: string;
  photo?: string;
  qty: number;
  kcalPerPortion: number;
  amount?: number;
  unit?: Unit;
  basis?: Basis;
  nutrients?: Nutrients;
  grades?: Grades;
  name: string;
}

export interface CustomFood {
  id: string;
  name: string;
  kcal: number;
  amount?: number;
  unit?: Unit;
  basis?: Basis;
  nutrients?: Nutrients;
  grades?: Grades;
  photo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  id: 'me';
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  targetKcal: number;
  targetOverridden: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WeightRecord {
  id?: number;
  date: DateKey;
  kg: number;
  createdAt: number;
}
