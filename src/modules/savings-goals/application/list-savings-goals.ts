import type { SavingsGoal, SavingsGoalStatus } from "../domain/savings-goal";

export type ListSavingsGoalsInput = {
  userId: string;
  status?: SavingsGoalStatus;
};

export type SavingsGoalListItem = SavingsGoal & {
  progressPercentage: number;
};

export type ListSavingsGoalsRepository = {
  listForUser(input: ListSavingsGoalsInput): Promise<SavingsGoalListItem[]>;
};

export async function listSavingsGoals(
  input: ListSavingsGoalsInput,
  repository: ListSavingsGoalsRepository,
): Promise<SavingsGoalListItem[]> {
  if (!input.userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listForUser(input);
}
