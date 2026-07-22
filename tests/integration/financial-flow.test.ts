import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAccount,
  type AccountRepository,
} from "../../src/modules/accounts/application/create-account";
import {
  calculateAccountBalance,
  type Account,
  type AccountMovement,
} from "../../src/modules/accounts/domain/account";
import type { Category } from "../../src/modules/categories/domain/category";
import type { CreditCard } from "../../src/modules/credit-cards/domain/credit-card";
import {
  payInvoice,
  type PayInvoiceDependencies,
} from "../../src/modules/invoices/application/pay-invoice";
import type { Invoice } from "../../src/modules/invoices/domain/invoice";
import {
  createTransaction,
  type CreateTransactionDependencies,
  type TransactionRecord,
} from "../../src/modules/transactions/application/create-transaction";
import { transactionAffectsAccountBalance } from "../../src/modules/transactions/domain/transaction";

describe("financial flow", () => {
  it("cria conta, registra lançamentos, compra no cartão e paga fatura", async () => {
    const userId = "user-1";
    const accounts: Account[] = [];
    const transactions: TransactionRecord[] = [];
    const movements: AccountMovement[] = [];
    const categories: Category[] = [
      {
        id: "income-category",
        userId,
        name: "Salário",
        kind: "INCOME",
        isActive: true,
      },
      {
        id: "expense-category",
        userId,
        name: "Alimentação",
        kind: "EXPENSE",
        isActive: true,
      },
    ];
    const card: CreditCard = {
      id: "card-1",
      userId,
      name: "Principal",
      limitInCents: 100_000,
      closingDay: 10,
      dueDay: 17,
      isActive: true,
    };
    let invoice: Invoice = {
      id: "invoice-1",
      userId,
      creditCardId: card.id,
      totalInCents: 30_000,
      paidInCents: 0,
      status: "CLOSED",
      closingAt: new Date("2026-07-10T00:00:00Z"),
      dueAt: new Date("2026-07-17T00:00:00Z"),
    };

    const accountRepository: AccountRepository = {
      async findByName(ownerId, name) {
        return (
          accounts.find(
            (account) =>
              account.userId === ownerId && account.name === name,
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

    const transactionDependencies: CreateTransactionDependencies = {
      accounts: {
        async findById(ownerId, accountId) {
          return (
            accounts.find(
              (account) =>
                account.userId === ownerId && account.id === accountId,
            ) ?? null
          );
        },
      },
      categories: {
        async findById(ownerId, categoryId) {
          return (
            categories.find(
              (category) =>
                category.userId === ownerId && category.id === categoryId,
            ) ?? null
          );
        },
      },
      creditCards: {
        async findById(ownerId, creditCardId) {
          if (card.userId !== ownerId || card.id !== creditCardId) return null;

          const committedInCents = transactions
            .filter((transaction) => transaction.creditCardId === creditCardId)
            .reduce((sum, transaction) => sum + transaction.amountInCents, 0);

          return { card, committedInCents };
        },
      },
      transactions: {
        async create(input) {
          const transaction: TransactionRecord = {
            ...input,
            id: `transaction-${transactions.length + 1}`,
            origin: "STANDARD",
          };
          transactions.push(transaction);

          if (transactionAffectsAccountBalance(transaction)) {
            movements.push({
              amountInCents: transaction.amountInCents,
              direction: transaction.kind === "INCOME" ? "CREDIT" : "DEBIT",
              status: transaction.status,
            });
          }

          return transaction;
        },
      },
    };

    const account = await createAccount(
      {
        userId,
        name: "Principal",
        type: "CHECKING",
        initialBalanceInCents: 0,
      },
      accountRepository,
    );

    await createTransaction(
      {
        userId,
        description: "Salário",
        amountInCents: 500_000,
        kind: "INCOME",
        status: "SETTLED",
        paymentMethod: "BANK_TRANSFER",
        categoryId: "income-category",
        accountId: account.id,
        occurredAt: new Date("2026-07-05T12:00:00Z"),
      },
      transactionDependencies,
    );

    await createTransaction(
      {
        userId,
        description: "Mercado",
        amountInCents: 12_500,
        kind: "EXPENSE",
        status: "SETTLED",
        paymentMethod: "PIX",
        categoryId: "expense-category",
        accountId: account.id,
        occurredAt: new Date("2026-07-06T12:00:00Z"),
      },
      transactionDependencies,
    );

    await createTransaction(
      {
        userId,
        description: "Compra no cartão",
        amountInCents: 30_000,
        kind: "EXPENSE",
        status: "SETTLED",
        paymentMethod: "CREDIT_CARD",
        categoryId: "expense-category",
        creditCardId: card.id,
        occurredAt: new Date("2026-07-07T12:00:00Z"),
      },
      transactionDependencies,
    );

    assert.equal(
      calculateAccountBalance(account.initialBalanceInCents, movements),
      487_500,
      "compra no cartão não deve reduzir saldo antes do pagamento da fatura",
    );

    const invoiceDependencies: PayInvoiceDependencies = {
      accounts: transactionDependencies.accounts,
      categories: transactionDependencies.categories,
      invoices: {
        async findById(ownerId, invoiceId) {
          return invoice.userId === ownerId && invoice.id === invoiceId
            ? invoice
            : null;
        },
        async applyPayment(input) {
          invoice = {
            ...invoice,
            paidInCents: input.nextPaidInCents,
            status: input.nextStatus,
          };
          movements.push({
            amountInCents: input.amountInCents,
            direction: "DEBIT",
            status: "SETTLED",
          });
          transactions.push({
            id: `transaction-${transactions.length + 1}`,
            userId,
            accountId: input.accountId,
            categoryId: input.categoryId,
            paidInvoiceId: input.invoiceId,
            description: input.description,
            amountInCents: input.amountInCents,
            kind: "EXPENSE",
            status: "SETTLED",
            origin: "STANDARD",
            paymentMethod: input.paymentMethod,
            occurredAt: input.paidAt,
          });
          return invoice;
        },
      },
      now: () => new Date("2026-07-15T12:00:00Z"),
    };

    const paidInvoice = await payInvoice(
      {
        userId,
        invoiceId: invoice.id,
        accountId: account.id,
        categoryId: "expense-category",
        amountInCents: 30_000,
        paymentMethod: "PIX",
      },
      invoiceDependencies,
    );

    assert.equal(paidInvoice.status, "PAID");
    assert.equal(
      calculateAccountBalance(account.initialBalanceInCents, movements),
      457_500,
    );
    assert.equal(transactions.length, 4);
  });
});
