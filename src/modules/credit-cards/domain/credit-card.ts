import {
  assertAmountInCents,
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";

export type CreditCard = {
  id: string;
  userId: string;
  name: string;
  limitInCents: AmountInCents;
  closingDay: number;
  dueDay: number;
  isActive: boolean;
};

export function validateCreditCard(card: CreditCard): CreditCard {
  if (!card.name.trim()) {
    throw new Error("O nome do cartão é obrigatório.");
  }

  assertPositiveAmountInCents(card.limitInCents, "limite");
  assertBillingDay(card.closingDay, "dia de fechamento");
  assertBillingDay(card.dueDay, "dia de vencimento");

  return { ...card, name: card.name.trim() };
}

export function calculateAvailableLimit(
  limitInCents: AmountInCents,
  committedInCents: AmountInCents,
): AmountInCents {
  assertAmountInCents(limitInCents, "limite");
  assertAmountInCents(committedInCents, "limite utilizado");
  return limitInCents - committedInCents;
}

export function assertPurchaseFitsLimit(
  purchaseInCents: AmountInCents,
  availableInCents: AmountInCents,
): void {
  assertPositiveAmountInCents(purchaseInCents, "compra");

  if (purchaseInCents > availableInCents) {
    throw new Error("A compra ultrapassa o limite disponível do cartão.");
  }
}

export function splitPurchaseIntoInstallments(
  totalInCents: AmountInCents,
  installmentCount: number,
): AmountInCents[] {
  assertPositiveAmountInCents(totalInCents, "compra");

  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error("A quantidade de parcelas deve ser um inteiro positivo.");
  }

  const base = Math.floor(totalInCents / installmentCount);
  const remainder = totalInCents % installmentCount;

  return Array.from(
    { length: installmentCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function assertBillingDay(day: number, fieldName: string): void {
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new Error(`${fieldName} deve estar entre 1 e 28.`);
  }
}
