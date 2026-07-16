import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createTransaction,
  type CreateTransactionDependencies,
} from "../../src/modules/transactions/application/create-transaction";
import type { CreateTransactionInput } from "../../src/modules/transactions/domain/transaction";

const input: CreateTransactionInput = {
  userId: "user-1",
  description: "Mercado",
  amountInCents: 20_000,
  kind: "EXPENSE",
  status: "SETTLED",
  paymentMethod: "PIX",
  categoryId: "category-1",
  accountId: "account-1",
  occurredAt: new Date("2026-07-01T12:00:00Z"),
};

function createDependencies(
  overrides: Partial<CreateTransactionDependencies> = {},
): CreateTransactionDependencies {
  let sequence = 0;

  return {
    accounts: {
      async findById(userId, accountId) {
        if (userId !== "user-1" || accountId !== "account-1") return null;
        return {
          id: accountId,
          userId,
          name: "Principal",
          type: "CHECKING",
          initialBalanceInCents: 0,
          isActive: true,
        };
      },
    },
    categories: {
      async findById(userId, categoryId) {
        if (userId !== "user-1" || categoryId !== "category-1") return null;
        return {
          id: categoryId,
          userId,
          name: "Alimentação",
          kind: "EXPENSE",
          isActive: true,
        };
      },
    },
    creditCards: {
      async findById(userId, creditCardId) {
        if (userId !== "user-1" || creditCardId !== "card-1") return null;
        return {
          card: {
            id: creditCardId,
            userId,
            name: "Principal",
            limitInCents: 100_000,
            closingDay: 10,
            dueDay: 17,
            isActive: true,
          },
          committedInCents: 40_000,
        };
      },
    },
    transactions: {
      async create(transaction) {
        sequence += 1;
        return { ...transaction, id: `transaction-${sequence}` };
      },
    },
    ...overrides,
  };
}

describe("createTransaction", () => {
  it("cria lançamento após validar propriedade e categoria", async () => {
    const transaction = await createTransaction(input, createDependencies());

    assert.equal(transaction.id, "transaction-1");
    assert.equal(transaction.amountInCents, 20_000);
  });

  it("rejeita conta de outro usuário", async () => {
    await assert.rejects(
      () =>
        createTransaction(
          { ...input, userId: "user-2" },
          createDependencies(),
        ),
      /Categoria não encontrada para esse usuário/,
    );
  });

  it("rejeita categoria incompatível", async () => {
    const dependencies = createDependencies({
      categories: {
        async findById(userId, categoryId) {
          return {
            id: categoryId,
            userId,
            name: "Salário",
            kind: "INCOME",
            isActive: true,
          };
        },
      },
    });

    await assert.rejects(
      () => createTransaction(input, dependencies),
      /não aceita esse tipo/,
    );
  });

  it("rejeita compra acima do limite disponível", async () => {
    await assert.rejects(
      () =>
        createTransaction(
          {
            ...input,
            amountInCents: 60_001,
            paymentMethod: "CREDIT_CARD",
            accountId: undefined,
            creditCardId: "card-1",
          },
          createDependencies(),
        ),
      /ultrapassa o limite/,
    );
  });
});
