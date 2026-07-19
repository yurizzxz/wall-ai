import {
  validateCreditCard,
  type CreditCard,
} from "../domain/credit-card";
import type { AmountInCents } from "../../shared/domain/money";

export type CreateCreditCardInput = {
  userId: string;
  name: string;
  lastFour?: string;
  limitInCents: AmountInCents;
  closingDay: number;
  dueDay: number;
};

export type CreditCardRepository = {
  findByName(userId: string, name: string): Promise<CreditCard | null>;
  create(input: CreateCreditCardInput): Promise<CreditCard>;
};

export async function createCreditCard(
  input: CreateCreditCardInput,
  repository: CreditCardRepository,
): Promise<CreditCard> {
  if (!input.userId) {
    throw new Error("O cartão precisa pertencer a um usuário.");
  }

  const card = validateCreditCard(input);
  const lastFour = input.lastFour?.trim() || undefined;

  if (lastFour && !/^\d{4}$/.test(lastFour)) {
    throw new Error("Os últimos dígitos devem conter exatamente 4 números.");
  }

  if (await repository.findByName(input.userId, card.name)) {
    throw new Error("Já existe um cartão com esse nome.");
  }

  return repository.create({ ...card, lastFour });
}
