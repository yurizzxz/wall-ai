import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import type { SavingsGoal } from "../domain/savings-goal";
import { BusinessError } from "../../shared/application/business-error";

export type CreateSavingsGoalInput = {
  userId: string;
  name: string;
  targetInCents: AmountInCents;
  deadline?: Date;
};

export type SavingsGoalRepository = {
  findByName(name: string): Promise<SavingsGoal | null>;
  create(input: CreateSavingsGoalInput): Promise<SavingsGoal>;
};

export async function createSavingsGoal(
  input: CreateSavingsGoalInput,
  repository: SavingsGoalRepository,
): Promise<SavingsGoal> {
  const name = input.name.trim();

  if (!input.userId) {
    throw new BusinessError("SAVINGS_GOAL_USER_REQUIRED", "O cofrinho precisa pertencer a um usuário.");
  }

  if (!name) {
    throw new BusinessError("SAVINGS_GOAL_NAME_REQUIRED", "O nome do cofrinho é obrigatório.");
  }

  assertPositiveAmountInCents(input.targetInCents, "meta");

  if (input.deadline && Number.isNaN(input.deadline.getTime())) {
    throw new BusinessError("INVALID_SAVINGS_GOAL_DEADLINE", "O prazo do cofrinho é inválido.");
  }

  if (await repository.findByName(name)) {
    throw new BusinessError("SAVINGS_GOAL_NAME_CONFLICT", "Já existe um cofrinho com esse nome.");
  }

  return repository.create({ ...input, name });
}
