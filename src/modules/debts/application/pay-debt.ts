import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import {
  assertCategoryAcceptsTransaction,
  type Category,
} from "../../categories/domain/category";
import {
  assertDebtPayment,
  deriveDebtStatus,
  type Debt,
  type DebtStatus,
} from "../domain/debt";
import type { AmountInCents } from "../../shared/domain/money";
import type { AccountPaymentMethod } from "../../transactions/domain/transaction";

export type PayDebtInput = {
  userId: string;
  debtId: string;
  accountId: string;
  categoryId: string;
  amountInCents: AmountInCents;
  paymentMethod: AccountPaymentMethod;
};

export type RecordDebtPaymentInput = PayDebtInput & {
  description: string;
  expectedPaidInCents: AmountInCents;
  nextPaidInCents: AmountInCents;
  nextStatus: DebtStatus;
  paidAt: Date;
};

export type PayDebtDependencies = {
  debts: {
    findById(userId: string, debtId: string): Promise<Debt | null>;
    recordPayment(input: RecordDebtPaymentInput): Promise<Debt>;
  };
  accounts: {
    findById(userId: string, accountId: string): Promise<Account | null>;
  };
  categories: {
    findById(userId: string, categoryId: string): Promise<Category | null>;
  };
  now(): Date;
};

export async function payDebt(
  input: PayDebtInput,
  dependencies: PayDebtDependencies,
): Promise<Debt> {
  const [debt, account, category] = await Promise.all([
    dependencies.debts.findById(input.userId, input.debtId),
    dependencies.accounts.findById(input.userId, input.accountId),
    dependencies.categories.findById(input.userId, input.categoryId),
  ]);

  if (!debt) {
    throw new Error("Dívida não encontrada para esse usuário.");
  }

  if (!account) {
    throw new Error("Conta não encontrada para esse usuário.");
  }

  if (!category) {
    throw new Error("Categoria não encontrada para esse usuário.");
  }

  assertAccountCanReceiveMovements(account);
  assertCategoryAcceptsTransaction(category, "EXPENSE");
  assertDebtPayment(debt, input.amountInCents);

  const paidAt = dependencies.now();
  const nextPaidInCents = debt.paidInCents + input.amountInCents;
  const nextStatus = deriveDebtStatus(
    { ...debt, paidInCents: nextPaidInCents },
    paidAt,
  );

  return dependencies.debts.recordPayment({
    ...input,
    description: `Pagamento de dívida: ${debt.description}`,
    expectedPaidInCents: debt.paidInCents,
    nextPaidInCents,
    nextStatus,
    paidAt,
  });
}
