import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import type { SavingsGoal } from "../domain/savings-goal";

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
    throw new Error("O cofrinho precisa pertencer a um usuário.");
  }

  if (!name) {
    throw new Error("O nome do cofrinho é obrigatório.");
  }

  assertPositiveAmountInCents(input.targetInCents, "meta");

  if (input.deadline && Number.isNaN(input.deadline.getTime())) {
    throw new Error("O prazo do cofrinho é inválido.");
  }

  if (await repository.findByName(name)) {
    throw new Error("Já existe um cofrinho com esse nome.");
  }

  return repository.create({ ...input, name });
}
