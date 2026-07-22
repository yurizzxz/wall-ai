import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import type { AmountInCents } from "../../shared/domain/money";
import {
  assertSavingsContribution,
  deriveSavingsGoalStatus,
  type SavingsGoal,
  type SavingsGoalStatus,
} from "../domain/savings-goal";
import { BusinessError } from "../../shared/application/business-error";

export type ContributeToSavingsGoalInput = {
  userId: string;
  savingsGoalId: string;
  accountId: string;
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
  now(): Date;
};

export async function contributeToSavingsGoal(
  input: ContributeToSavingsGoalInput,
  dependencies: ContributeToSavingsGoalDependencies,
): Promise<SavingsGoal> {
  const [goal, account] = await Promise.all([
    dependencies.savingsGoals.findById(
      input.userId,
      input.savingsGoalId,
    ),
    dependencies.accounts.findById(input.userId, input.accountId),
  ]);

  if (!goal) {
    throw new BusinessError(
      "SAVINGS_GOAL_NOT_FOUND",
      "Cofrinho não encontrado para esse usuário.",
    );
  }

  if (!account) {
    throw new BusinessError(
      "ACCOUNT_NOT_FOUND",
      "Conta não encontrada para esse usuário.",
    );
  }

  assertAccountCanReceiveMovements(account);
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
