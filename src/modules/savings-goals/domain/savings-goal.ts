import {
  assertAmountInCents,
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";

export type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type SavingsGoal = {
  id: string;
  userId: string;
  name: string;
  targetInCents: AmountInCents;
  savedInCents: AmountInCents;
  deadline?: Date;
  status: SavingsGoalStatus;
};

export function assertSavingsContribution(
  goal: SavingsGoal,
  contributionInCents: AmountInCents,
): void {
  assertPositiveAmountInCents(contributionInCents, "aporte");

  if (goal.status !== "ACTIVE") {
    throw new Error("Somente cofrinhos ativos podem receber aportes.");
  }
}

export function calculateSavingsProgress(goal: SavingsGoal): number {
  assertPositiveAmountInCents(goal.targetInCents, "meta");
  assertAmountInCents(goal.savedInCents, "valor guardado");

  return Math.min(100, (goal.savedInCents / goal.targetInCents) * 100);
}

export function deriveSavingsGoalStatus(
  goal: SavingsGoal,
): SavingsGoalStatus {
  if (goal.status === "CANCELLED") {
    return "CANCELLED";
  }

  return goal.savedInCents >= goal.targetInCents ? "COMPLETED" : "ACTIVE";
}
