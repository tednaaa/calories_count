import type { CategoryId } from './categories';
import type { Basis, Grades, Nutrients, Unit } from '@/shared/db';

export interface Food {
  id: string;
  name: string;
  kcal: number;
  amount?: number;
  unit?: Unit;
  basis?: Basis;
  nutrients?: Nutrients;
  grades?: Grades;
  photo?: string;
  category: CategoryId;
  tags?: string[];
  archived?: boolean;
}

export type Portion = Pick<Food, 'id' | 'name' | 'kcal' | 'amount' | 'unit' | 'basis' | 'nutrients' | 'grades'>;
