import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import {
  assertCategoryAcceptsTransaction,
  type Category,
} from "../../categories/domain/category";
import type { AmountInCents } from "../../shared/domain/money";
import {
  assertSavingsContribution,
  deriveSavingsGoalStatus,
  type SavingsGoal,
  type SavingsGoalStatus,
} from "../domain/savings-goal";

export type ContributeToSavingsGoalInput = {
  userId: string;
  savingsGoalId: string;
  accountId: string;
  categoryId: string;
  amountInCents: AmountInCents;
};

export type RecordSavingsContributionInput =
  ContributeToSavingsGoalInput & {
    description: string;
    expectedSavedInCents: AmountInCents;
    nextSavedInCents: AmountInCents;
    nextStatus: SavingsGoalStatus;
    contributedAt: Date;
  };

export type ContributeToSavingsGoalDependencies = {
  savingsGoals: {
    findById(
      userId: string,
      savingsGoalId: string,
    ): Promise<SavingsGoal | null>;
    recordContribution(
      input: RecordSavingsContributionInput,
    ): Promise<SavingsGoal>;
  };
  accounts: {
    findById(userId: string, accountId: string): Promise<Account | null>;
  };
  categories: {
    findById(userId: string, categoryId: string): Promise<Category | null>;
  };
  now(): Date;
};

export async function contributeToSavingsGoal(
  input: ContributeToSavingsGoalInput,
  dependencies: ContributeToSavingsGoalDependencies,
): Promise<SavingsGoal> {
  const [goal, account, category] = await Promise.all([
    dependencies.savingsGoals.findById(
      input.userId,
      input.savingsGoalId,
    ),
    dependencies.accounts.findById(input.userId, input.accountId),
    dependencies.categories.findById(input.userId, input.categoryId),
  ]);

  if (!goal) {
    throw new Error("Cofrinho não encontrado para esse usuário.");
  }

  if (!account) {
    throw new Error("Conta não encontrada para esse usuário.");
  }

  if (!category) {
    throw new Error("Categoria não encontrada para esse usuário.");
  }

  assertAccountCanReceiveMovements(account);
  assertCategoryAcceptsTransaction(category, "EXPENSE");
  assertSavingsContribution(goal, input.amountInCents);

  const contributedAt = dependencies.now();
  const nextSavedInCents = goal.savedInCents + input.amountInCents;
  const nextStatus = deriveSavingsGoalStatus({
    ...goal,
    savedInCents: nextSavedInCents,
  });

  return dependencies.savingsGoals.recordContribution({
    ...input,
    description: `Aporte no cofrinho: ${goal.name}`,
    expectedSavedInCents: goal.savedInCents,
    nextSavedInCents,
    nextStatus,
    contributedAt,
  });
}
