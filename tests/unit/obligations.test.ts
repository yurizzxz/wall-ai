import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertDebtPayment,
  calculateDebtOutstanding,
  deriveDebtStatus,
  type Debt,
} from "../../src/modules/debts/domain/debt";
import {
  assertInvoiceCanBePaid,
  deriveInvoiceStatus,
  type Invoice,
} from "../../src/modules/invoices/domain/invoice";
import {
  assertSavingsContribution,
  calculateSavingsProgress,
  deriveSavingsGoalStatus,
  type SavingsGoal,
} from "../../src/modules/savings-goals/domain/savings-goal";

const invoice: Invoice = {
  id: "invoice-1",
  userId: "user-1",
  creditCardId: "card-1",
  totalInCents: 50_000,
  paidInCents: 0,
  status: "CLOSED",
  closingAt: new Date("2026-07-10T00:00:00Z"),
  dueAt: new Date("2026-07-17T00:00:00Z"),
};

const debt: Debt = {
  id: "debt-1",
  userId: "user-1",
  creditor: "Banco",
  description: "Empréstimo",
  totalInCents: 100_000,
  paidInCents: 25_000,
  dueAt: new Date("2026-07-10T00:00:00Z"),
  status: "OPEN",
};

const goal: SavingsGoal = {
  id: "goal-1",
  userId: "user-1",
  name: "Reserva",
  targetInCents: 100_000,
  savedInCents: 25_000,
  status: "ACTIVE",
};

describe("invoice", () => {
  it("aceita pagamento fechado e rejeita valor excedente", () => {
    assert.doesNotThrow(() => assertInvoiceCanBePaid(invoice, 50_000));
    assert.throws(() => assertInvoiceCanBePaid(invoice, 50_001), /ultrapassar/);
    assert.throws(
      () => assertInvoiceCanBePaid({ ...invoice, status: "OPEN" }, 1000),
      /precisa estar fechada/,
    );
  });

  it("deriva status pago e vencido", () => {
    assert.equal(
      deriveInvoiceStatus({ ...invoice, paidInCents: 50_000 }),
      "PAID",
    );
    assert.equal(
      deriveInvoiceStatus(invoice, new Date("2026-07-18T00:00:00Z")),
      "OVERDUE",
    );
  });
});

describe("debt", () => {
  it("calcula saldo e controla pagamento", () => {
    assert.equal(calculateDebtOutstanding(debt), 75_000);
    assert.doesNotThrow(() => assertDebtPayment(debt, 75_000));
    assert.throws(() => assertDebtPayment(debt, 75_001), /saldo devedor/);
  });

  it("deriva status vencido e pago", () => {
    assert.equal(
      deriveDebtStatus(debt, new Date("2026-07-11T00:00:00Z")),
      "OVERDUE",
    );
    assert.equal(deriveDebtStatus({ ...debt, paidInCents: 100_000 }), "PAID");
  });
});

describe("savings goal", () => {
  it("calcula progresso e conclui meta", () => {
    assert.equal(calculateSavingsProgress(goal), 25);
    assert.equal(
      deriveSavingsGoalStatus({ ...goal, savedInCents: 100_000 }),
      "COMPLETED",
    );
  });

  it("aceita aporte somente em meta ativa", () => {
    assert.doesNotThrow(() => assertSavingsContribution(goal, 1000));
    assert.throws(
      () =>
        assertSavingsContribution({ ...goal, status: "COMPLETED" }, 1000),
      /Somente cofrinhos ativos/,
    );
  });
});
