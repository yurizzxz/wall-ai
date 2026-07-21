import {
  assertAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import type { Account, AccountType } from "../domain/account";
import { BusinessError } from "../../shared/application/business-error";

export type CreateAccountInput = {
  userId: string;
  name: string;
  type: AccountType;
  initialBalanceInCents: AmountInCents;
};

export type AccountRepository = {
  findByName(userId: string, name: string): Promise<Account | null>;
  create(input: CreateAccountInput): Promise<Account>;
};

export async function createAccount(
  input: CreateAccountInput,
  repository: AccountRepository,
): Promise<Account> {
  const name = input.name.trim();

  if (!input.userId) {
    throw new BusinessError("ACCOUNT_USER_REQUIRED", "A conta precisa pertencer a um usuário.");
  }

  if (!name) {
    throw new BusinessError("ACCOUNT_NAME_REQUIRED", "O nome da conta é obrigatório.");
  }

  assertAmountInCents(input.initialBalanceInCents, "saldo inicial");

  if (await repository.findByName(input.userId, name)) {
    throw new BusinessError("ACCOUNT_NAME_CONFLICT", "Já existe uma conta com esse nome.");
  }

  return repository.create({ ...input, name });
}
