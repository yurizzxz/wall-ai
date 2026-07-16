import {
  assertAmountInCents,
  type AmountInCents,
} from "@/modules/shared/domain/money";

export type AccountType = "CHECKING" | "SAVINGS" | "CASH" | "INVESTMENT";

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalanceInCents: AmountInCents;
  isActive: boolean;
};

export type AccountMovement = {
  amountInCents: AmountInCents;
  direction: "CREDIT" | "DEBIT";
  status: "PENDING" | "SETTLED" | "CANCELLED";
};

export function calculateAccountBalance(
  initialBalanceInCents: AmountInCents,
  movements: readonly AccountMovement[],
): AmountInCents {
  assertAmountInCents(initialBalanceInCents, "saldo inicial");

  return movements.reduce((balance, movement) => {
    assertAmountInCents(movement.amountInCents);

    if (movement.status !== "SETTLED") {
      return balance;
    }

    return movement.direction === "CREDIT"
      ? balance + movement.amountInCents
      : balance - movement.amountInCents;
  }, initialBalanceInCents);
}

export function assertAccountCanReceiveMovements(account: Account): void {
  if (!account.isActive) {
    throw new Error("Uma conta inativa não pode receber movimentações.");
  }
}
