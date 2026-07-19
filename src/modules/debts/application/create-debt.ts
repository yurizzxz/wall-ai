import type { Debt } from "../domain/debt";
import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";

export type CreateDebtInput = {
  userId: string;
  creditor: string;
  description: string;
  totalInCents: AmountInCents;
  dueAt?: Date;
};

export type DebtRepository = {
  create(input: CreateDebtInput): Promise<Debt>;
};

export async function createDebt(
  input: CreateDebtInput,
  repository: DebtRepository,
): Promise<Debt> {
  const creditor = input.creditor.trim();
  const description = input.description.trim();

  if (!input.userId) {
    throw new Error("A dívida precisa pertencer a um usuário.");
  }

  if (!creditor) {
    throw new Error("O credor é obrigatório.");
  }

  if (!description) {
    throw new Error("A descrição da dívida é obrigatória.");
  }

  assertPositiveAmountInCents(input.totalInCents, "total da dívida");

  if (input.dueAt && Number.isNaN(input.dueAt.getTime())) {
    throw new Error("A data de vencimento é inválida.");
  }

  return repository.create({
    ...input,
    creditor,
    description,
  });
}
