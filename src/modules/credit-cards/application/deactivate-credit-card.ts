import type { CreditCard } from "../domain/credit-card";
import type { AmountInCents } from "../../shared/domain/money";
import { BusinessError } from "../../shared/application/business-error";

export type DeactivateCreditCardInput = {
  userId: string;
  creditCardId: string;
};

export type DeactivateCreditCardDependencies = {
  creditCards: {
    findById(
      userId: string,
      creditCardId: string,
    ): Promise<{ card: CreditCard; committedInCents: AmountInCents } | null>;
    setActive(userId: string, creditCardId: string, isActive: boolean): Promise<CreditCard>;
  };
};

export async function deactivateCreditCard(
  input: DeactivateCreditCardInput,
  dependencies: DeactivateCreditCardDependencies,
): Promise<CreditCard> {
  const result = await dependencies.creditCards.findById(
    input.userId,
    input.creditCardId,
  );

  if (!result) {
    throw new BusinessError(
      "CARD_NOT_FOUND",
      "Cartão não encontrado para esse usuário.",
    );
  }

  if (!result.card.isActive) {
    throw new BusinessError("CARD_ALREADY_INACTIVE", "O cartão já está inativo.");
  }

  if (result.committedInCents > 0) {
    throw new BusinessError("CARD_HAS_COMMITTED_BALANCE", "Quite os valores comprometidos antes de desativar o cartão.");
  }

  return dependencies.creditCards.setActive(
    input.userId,
    input.creditCardId,
    false,
  );
}
