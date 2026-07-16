export type AmountInCents = number;

export function assertAmountInCents(
  value: number,
  fieldName = "valor",
): AmountInCents {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${fieldName} deve ser informado em centavos inteiros.`);
  }

  if (value < 0) {
    throw new Error(`${fieldName} não pode ser negativo.`);
  }

  return value;
}

export function assertPositiveAmountInCents(
  value: number,
  fieldName = "valor",
): AmountInCents {
  assertAmountInCents(value, fieldName);

  if (value === 0) {
    throw new Error(`${fieldName} deve ser maior que zero.`);
  }

  return value;
}

export function sumAmounts(values: readonly AmountInCents[]): AmountInCents {
  const total = values.reduce((sum, value) => sum + value, 0);
  return assertAmountInCents(total, "total");
}
