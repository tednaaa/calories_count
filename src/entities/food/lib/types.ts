import type { CategoryId } from './categories';
import type { Basis } from '@/shared/db';

export interface Food {
  id: string;
  name: string;
  kcal: number;
  grams?: number;
  basis?: Basis;
  photo?: string;
  category: CategoryId;
  tags?: string[];
  archived?: boolean;
}

export type Portion = Pick<Food, 'id' | 'name' | 'kcal' | 'grams' | 'basis'>;
