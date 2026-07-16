import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAccount,
  type AccountRepository,
} from "../../src/modules/accounts/application/create-account";
import type { Account } from "../../src/modules/accounts/domain/account";

function createRepository(initial: Account[] = []): AccountRepository {
  const accounts = [...initial];

  return {
    async findByName(userId, name) {
      return (
        accounts.find(
          (account) => account.userId === userId && account.name === name,
        ) ?? null
      );
    },
    async create(input) {
      const account: Account = {
        id: `account-${accounts.length + 1}`,
        ...input,
        isActive: true,
      };
      accounts.push(account);
      return account;
    },
  };
}

describe("createAccount", () => {
  it("normaliza e cria conta", async () => {
    const account = await createAccount(
      {
        userId: "user-1",
        name: "  Principal  ",
        type: "CHECKING",
        initialBalanceInCents: 100_000,
      },
      createRepository(),
    );

    assert.equal(account.name, "Principal");
    assert.equal(account.initialBalanceInCents, 100_000);
  });

  it("rejeita nome duplicado para mesmo usuário", async () => {
    const existing: Account = {
      id: "account-1",
      userId: "user-1",
      name: "Principal",
      type: "CHECKING",
      initialBalanceInCents: 0,
      isActive: true,
    };

    await assert.rejects(
      () =>
        createAccount(
          {
            userId: "user-1",
            name: "Principal",
            type: "SAVINGS",
            initialBalanceInCents: 0,
          },
          createRepository([existing]),
        ),
      /Já existe uma conta/,
    );
  });
});
