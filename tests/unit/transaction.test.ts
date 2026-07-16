import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  transactionAffectsAccountBalance,
  validateTransaction,
  type CreateTransactionInput,
} from "../../src/modules/transactions/domain/transaction";

const baseTransaction: CreateTransactionInput = {
  userId: "user-1",
  description: "Mercado",
  amountInCents: 10_000,
  kind: "EXPENSE",
  status: "SETTLED",
  paymentMethod: "PIX",
  categoryId: "category-1",
  accountId: "account-1",
  occurredAt: new Date("2026-07-01T12:00:00Z"),
};

describe("transaction", () => {
  it("normaliza descrição e aceita lançamento válido", () => {
    const result = validateTransaction({
      ...baseTransaction,
      description: "  Mercado  ",
    });

    assert.equal(result.description, "Mercado");
  });

  it("rejeita receita no cartão de crédito", () => {
    assert.throws(
      () =>
        validateTransaction({
          ...baseTransaction,
          kind: "INCOME",
          paymentMethod: "CREDIT_CARD",
          accountId: undefined,
          creditCardId: "card-1",
        }),
      /Recebimentos não podem usar cartão/,
    );
  });

  it("rejeita compra no crédito sem cartão", () => {
    assert.throws(
      () =>
        validateTransaction({
          ...baseTransaction,
          paymentMethod: "CREDIT_CARD",
          accountId: undefined,
        }),
      /precisa indicar o cartão/,
    );
  });

  it("rejeita mistura entre conta e cartão", () => {
    assert.throws(
      () =>
        validateTransaction({
          ...baseTransaction,
          paymentMethod: "CREDIT_CARD",
          creditCardId: "card-1",
        }),
      /não movimenta uma conta diretamente/,
    );

    assert.throws(
      () =>
        validateTransaction({
          ...baseTransaction,
          creditCardId: "card-1",
        }),
      /Somente compras no crédito/,
    );
  });

  it("somente lançamento liquidado fora do crédito afeta saldo", () => {
    assert.equal(transactionAffectsAccountBalance(baseTransaction), true);
    assert.equal(
      transactionAffectsAccountBalance({
        ...baseTransaction,
        status: "PENDING",
      }),
      false,
    );
    assert.equal(
      transactionAffectsAccountBalance({
        ...baseTransaction,
        paymentMethod: "CREDIT_CARD",
      }),
      false,
    );
  });
});
