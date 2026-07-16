import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateAccountBalance } from "../../src/modules/accounts/domain/account";
import {
  assertPurchaseFitsLimit,
  calculateAvailableLimit,
  splitPurchaseIntoInstallments,
  validateCreditCard,
} from "../../src/modules/credit-cards/domain/credit-card";

describe("account", () => {
  it("calcula saldo usando somente movimentações liquidadas", () => {
    const balance = calculateAccountBalance(100_000, [
      { amountInCents: 50_000, direction: "CREDIT", status: "SETTLED" },
      { amountInCents: 20_000, direction: "DEBIT", status: "SETTLED" },
      { amountInCents: 99_000, direction: "DEBIT", status: "PENDING" },
      { amountInCents: 99_000, direction: "DEBIT", status: "CANCELLED" },
    ]);

    assert.equal(balance, 130_000);
  });
});

describe("credit card", () => {
  it("calcula limite disponível e rejeita excesso", () => {
    assert.equal(calculateAvailableLimit(100_000, 35_000), 65_000);
    assert.doesNotThrow(() => assertPurchaseFitsLimit(65_000, 65_000));
    assert.throws(
      () => assertPurchaseFitsLimit(65_001, 65_000),
      /ultrapassa o limite/,
    );
  });

  it("divide parcelas preservando valor total", () => {
    const installments = splitPurchaseIntoInstallments(1000, 3);

    assert.deepEqual(installments, [334, 333, 333]);
    assert.equal(installments.reduce((sum, value) => sum + value, 0), 1000);
  });

  it("valida limite e dias de fechamento e vencimento", () => {
    const validCard = {
      id: "card-1",
      userId: "user-1",
      name: "Principal",
      limitInCents: 100_000,
      closingDay: 10,
      dueDay: 17,
      isActive: true,
    } as const;

    assert.equal(validateCreditCard(validCard).name, "Principal");
    assert.throws(
      () => validateCreditCard({ ...validCard, closingDay: 31 }),
      /entre 1 e 28/,
    );
  });
});
