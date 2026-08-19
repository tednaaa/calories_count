import type { CategoryId } from './categories';

export interface Food {
  id: string;
  name: string;
  kcal: number;
  photo: string;
  category: CategoryId;
  tags?: string[];
  archived?: boolean;
}
