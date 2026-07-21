import type { Debt } from "../domain/debt";
import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import { BusinessError } from "../../shared/application/business-error";

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
    throw new BusinessError("DEBT_USER_REQUIRED", "A dívida precisa pertencer a um usuário.");
  }

  if (!creditor) {
    throw new BusinessError("DEBT_CREDITOR_REQUIRED", "O credor é obrigatório.");
  }

  if (!description) {
    throw new BusinessError("DEBT_DESCRIPTION_REQUIRED", "A descrição da dívida é obrigatória.");
  }

  assertPositiveAmountInCents(input.totalInCents, "total da dívida");

  if (input.dueAt && Number.isNaN(input.dueAt.getTime())) {
    throw new BusinessError("INVALID_DEBT_DUE_DATE", "A data de vencimento é inválida.");
  }

  return repository.create({
    ...input,
    creditor,
    description,
  });
}
