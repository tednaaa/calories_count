interface LegacyBasis {
  grams?: number;
  amount?: number;
  kcal: number;
}

interface LegacyRow {
  grams?: number;
  amount?: number;
  basis?: LegacyBasis;
}

export function renameGrams<T>(row: T): T {
  const legacy = row as LegacyRow;

  if (legacy.grams !== undefined) {
    legacy.amount = legacy.grams;
    delete legacy.grams;
  }

  if (legacy.basis?.grams !== undefined) {
    legacy.basis.amount = legacy.basis.grams;
    delete legacy.basis.grams;
  }

  return row;
}
