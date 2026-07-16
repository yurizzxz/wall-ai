import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (r) => ({
  userTable: {
    accounts: r.many.accountTable(),
    categories: r.many.categoryTable(),
    creditCards: r.many.creditCardTable(),
    invoices: r.many.invoiceTable(),
    transactions: r.many.transactionTable(),
    debts: r.many.debtTable(),
    debtPayments: r.many.debtPaymentTable(),
    savingsGoals: r.many.savingsGoalTable(),
    savingsContributions: r.many.savingsContributionTable(),
    recurringTransactions: r.many.recurringTransactionTable(),
  },

  accountTable: {
    user: r.one.userTable({
      from: r.accountTable.userId,
      to: r.userTable.id,
    }),
    transactions: r.many.transactionTable(),
    debtPayments: r.many.debtPaymentTable(),
    savingsContributions: r.many.savingsContributionTable(),
    recurringTransactions: r.many.recurringTransactionTable(),
  },

  categoryTable: {
    user: r.one.userTable({
      from: r.categoryTable.userId,
      to: r.userTable.id,
    }),
    transactions: r.many.transactionTable(),
    recurringTransactions: r.many.recurringTransactionTable(),
  },

  creditCardTable: {
    user: r.one.userTable({
      from: r.creditCardTable.userId,
      to: r.userTable.id,
    }),
    purchases: r.many.transactionTable(),
    invoices: r.many.invoiceTable(),
    recurringTransactions: r.many.recurringTransactionTable(),
  },

  invoiceTable: {
    user: r.one.userTable({
      from: r.invoiceTable.userId,
      to: r.userTable.id,
    }),
    creditCard: r.one.creditCardTable({
      from: r.invoiceTable.creditCardId,
      to: r.creditCardTable.id,
    }),
    installments: r.many.creditCardInstallmentTable(),
    paymentTransactions: r.many.transactionTable(),
  },

  transactionTable: {
    user: r.one.userTable({
      from: r.transactionTable.userId,
      to: r.userTable.id,
    }),
    account: r.one.accountTable({
      from: r.transactionTable.accountId,
      to: r.accountTable.id,
    }),
    category: r.one.categoryTable({
      from: r.transactionTable.categoryId,
      to: r.categoryTable.id,
    }),
    creditCard: r.one.creditCardTable({
      from: r.transactionTable.creditCardId,
      to: r.creditCardTable.id,
    }),
    paidInvoice: r.one.invoiceTable({
      from: r.transactionTable.paidInvoiceId,
      to: r.invoiceTable.id,
    }),
    sourceRecurrence: r.one.recurringTransactionTable({
      from: r.transactionTable.sourceRecurringTransactionId,
      to: r.recurringTransactionTable.id,
    }),
    installments: r.many.creditCardInstallmentTable(),
    // FK única (debtPaymentTable.transactionId / savingsContributionTable.transactionId
    // têm uniqueIndex) -> relação 1:1, por isso "one" em vez de "many" aqui.
    debtPayment: r.one.debtPaymentTable(),
    savingsContribution: r.one.savingsContributionTable(),
  },

  creditCardInstallmentTable: {
    purchase: r.one.transactionTable({
      from: r.creditCardInstallmentTable.purchaseId,
      to: r.transactionTable.id,
    }),
    invoice: r.one.invoiceTable({
      from: r.creditCardInstallmentTable.invoiceId,
      to: r.invoiceTable.id,
    }),
  },

  debtTable: {
    user: r.one.userTable({
      from: r.debtTable.userId,
      to: r.userTable.id,
    }),
    payments: r.many.debtPaymentTable(),
  },

  debtPaymentTable: {
    user: r.one.userTable({
      from: r.debtPaymentTable.userId,
      to: r.userTable.id,
    }),
    debt: r.one.debtTable({
      from: r.debtPaymentTable.debtId,
      to: r.debtTable.id,
    }),
    account: r.one.accountTable({
      from: r.debtPaymentTable.accountId,
      to: r.accountTable.id,
    }),
    transaction: r.one.transactionTable({
      from: r.debtPaymentTable.transactionId,
      to: r.transactionTable.id,
    }),
  },

  savingsGoalTable: {
    user: r.one.userTable({
      from: r.savingsGoalTable.userId,
      to: r.userTable.id,
    }),
    contributions: r.many.savingsContributionTable(),
  },

  savingsContributionTable: {
    user: r.one.userTable({
      from: r.savingsContributionTable.userId,
      to: r.userTable.id,
    }),
    savingsGoal: r.one.savingsGoalTable({
      from: r.savingsContributionTable.savingsGoalId,
      to: r.savingsGoalTable.id,
    }),
    account: r.one.accountTable({
      from: r.savingsContributionTable.accountId,
      to: r.accountTable.id,
    }),
    transaction: r.one.transactionTable({
      from: r.savingsContributionTable.transactionId,
      to: r.transactionTable.id,
    }),
  },

  recurringTransactionTable: {
    user: r.one.userTable({
      from: r.recurringTransactionTable.userId,
      to: r.userTable.id,
    }),
    account: r.one.accountTable({
      from: r.recurringTransactionTable.accountId,
      to: r.accountTable.id,
    }),
    category: r.one.categoryTable({
      from: r.recurringTransactionTable.categoryId,
      to: r.categoryTable.id,
    }),
    creditCard: r.one.creditCardTable({
      from: r.recurringTransactionTable.creditCardId,
      to: r.creditCardTable.id,
    }),
    occurrences: r.many.transactionTable(),
  },
}));