import {
  validateCreditCard,
  type CreditCard,
} from "../domain/credit-card";
import type { AmountInCents } from "../../shared/domain/money";
import { BusinessError } from "../../shared/application/business-error";

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
    throw new BusinessError("CARD_USER_REQUIRED", "O cartão precisa pertencer a um usuário.");
  }

  const card = validateCreditCard(input);
  const lastFour = input.lastFour?.trim() || undefined;

  if (lastFour && !/^\d{4}$/.test(lastFour)) {
    throw new BusinessError("INVALID_CARD_LAST_FOUR", "Os últimos dígitos devem conter exatamente 4 números.");
  }

  if (await repository.findByName(input.userId, card.name)) {
    throw new BusinessError("CARD_NAME_CONFLICT", "Já existe um cartão com esse nome.");
  }

  return repository.create({ ...card, lastFour });
}
