import type { AmountInCents } from "../../shared/domain/money";
import type { CreditCard } from "../domain/credit-card";

export type CreditCardListItem = CreditCard & {
  lastFour?: string;
  committedInCents: AmountInCents;
  availableInCents: AmountInCents;
};

export type ListCreditCardsRepository = {
  listWithUsage(userId: string): Promise<CreditCardListItem[]>;
};

export async function listCreditCards(
  userId: string,
  repository: ListCreditCardsRepository,
): Promise<CreditCardListItem[]> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listWithUsage(userId);
}
