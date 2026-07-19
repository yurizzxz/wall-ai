import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  payInvoice,
  type ApplyInvoicePaymentInput,
  type PayInvoiceDependencies,
} from "../../src/modules/invoices/application/pay-invoice";
import type { Invoice } from "../../src/modules/invoices/domain/invoice";

const invoice: Invoice = {
  id: "invoice-1",
  userId: "user-1",
  creditCardId: "card-1",
  totalInCents: 30_000,
  paidInCents: 0,
  status: "CLOSED",
  closingAt: new Date("2026-07-10T00:00:00Z"),
  dueAt: new Date("2026-07-17T00:00:00Z"),
};

function createDependencies(
  applied: ApplyInvoicePaymentInput[],
): PayInvoiceDependencies {
  return {
    invoices: {
      async findById(userId, invoiceId) {
        return userId === invoice.userId && invoiceId === invoice.id
          ? invoice
          : null;
      },
      async applyPayment(input) {
        applied.push(input);
        return {
          ...invoice,
          paidInCents: input.nextPaidInCents,
          status: input.nextStatus,
        };
      },
    },
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
        if (userId !== "user-1" || categoryId !== "expense-category") return null;
        return {
          id: categoryId,
          userId,
          name: "Pagamento de fatura",
          kind: "EXPENSE",
          isActive: true,
        };
      },
    },
    now: () => new Date("2026-07-15T12:00:00Z"),
  };
}

describe("payInvoice", () => {
  it("calcula estado final e delega operação atômica", async () => {
    const applied: ApplyInvoicePaymentInput[] = [];
    const result = await payInvoice(
      {
        userId: "user-1",
        invoiceId: "invoice-1",
        accountId: "account-1",
        categoryId: "expense-category",
        amountInCents: 30_000,
        paymentMethod: "PIX",
      },
      createDependencies(applied),
    );

    assert.equal(result.status, "PAID");
    assert.equal(result.paidInCents, 30_000);
    assert.equal(applied.length, 1);
    assert.equal(applied[0]?.nextStatus, "PAID");
  });

  it("não persiste pagamento excedente", async () => {
    const applied: ApplyInvoicePaymentInput[] = [];

    await assert.rejects(
      () =>
        payInvoice(
          {
            userId: "user-1",
            invoiceId: "invoice-1",
            accountId: "account-1",
            categoryId: "expense-category",
            amountInCents: 30_001,
            paymentMethod: "PIX",
          },
          createDependencies(applied),
        ),
      /ultrapassar o saldo/,
    );

    assert.equal(applied.length, 0);
  });
});
