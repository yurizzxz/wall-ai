import { relations } from "drizzle-orm";

import {
  account as authAccount,
  session,
  user,
} from "@/db/auth-schema";
import {
  categoryTable,
  creditCardInstallmentTable,
  creditCardTable,
  debtPaymentTable,
  debtTable,
  financialAccountTable,
  invoiceTable,
  recurringTransactionTable,
  savingsContributionTable,
  savingsGoalTable,
  transactionTable,
} from "@/db/schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  authAccounts: many(authAccount),
  financialAccounts: many(financialAccountTable),
  categories: many(categoryTable),
  creditCards: many(creditCardTable),
  invoices: many(invoiceTable),
  transactions: many(transactionTable),
  debts: many(debtTable),
  debtPayments: many(debtPaymentTable),
  savingsGoals: many(savingsGoalTable),
  savingsContributions: many(savingsContributionTable),
  recurringTransactions: many(recurringTransactionTable),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const authAccountRelations = relations(authAccount, ({ one }) => ({
  user: one(user, {
    fields: [authAccount.userId],
    references: [user.id],
  }),
}));

export const financialAccountRelations = relations(
  financialAccountTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [financialAccountTable.userId],
      references: [user.id],
    }),
    transactions: many(transactionTable),
    debtPayments: many(debtPaymentTable),
    savingsContributions: many(savingsContributionTable),
    recurringTransactions: many(recurringTransactionTable),
  }),
);

export const categoryRelations = relations(categoryTable, ({ one, many }) => ({
  user: one(user, {
    fields: [categoryTable.userId],
    references: [user.id],
  }),
  transactions: many(transactionTable),
  recurringTransactions: many(recurringTransactionTable),
}));

export const creditCardRelations = relations(
  creditCardTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [creditCardTable.userId],
      references: [user.id],
    }),
    purchases: many(transactionTable),
    invoices: many(invoiceTable),
    recurringTransactions: many(recurringTransactionTable),
  }),
);

export const invoiceRelations = relations(invoiceTable, ({ one, many }) => ({
  user: one(user, {
    fields: [invoiceTable.userId],
    references: [user.id],
  }),
  creditCard: one(creditCardTable, {
    fields: [invoiceTable.creditCardId],
    references: [creditCardTable.id],
  }),
  installments: many(creditCardInstallmentTable),
  paymentTransactions: many(transactionTable),
}));

export const transactionRelations = relations(
  transactionTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [transactionTable.userId],
      references: [user.id],
    }),
    account: one(financialAccountTable, {
      fields: [transactionTable.accountId],
      references: [financialAccountTable.id],
    }),
    category: one(categoryTable, {
      fields: [transactionTable.categoryId],
      references: [categoryTable.id],
    }),
    creditCard: one(creditCardTable, {
      fields: [transactionTable.creditCardId],
      references: [creditCardTable.id],
    }),
    paidInvoice: one(invoiceTable, {
      fields: [transactionTable.paidInvoiceId],
      references: [invoiceTable.id],
    }),
    sourceRecurrence: one(recurringTransactionTable, {
      fields: [transactionTable.sourceRecurringTransactionId],
      references: [recurringTransactionTable.id],
    }),
    installments: many(creditCardInstallmentTable),
    debtPayment: one(debtPaymentTable),
    savingsContribution: one(savingsContributionTable),
  }),
);

export const creditCardInstallmentRelations = relations(
  creditCardInstallmentTable,
  ({ one }) => ({
    purchase: one(transactionTable, {
      fields: [creditCardInstallmentTable.purchaseId],
      references: [transactionTable.id],
    }),
    invoice: one(invoiceTable, {
      fields: [creditCardInstallmentTable.invoiceId],
      references: [invoiceTable.id],
    }),
  }),
);

export const debtRelations = relations(debtTable, ({ one, many }) => ({
  user: one(user, {
    fields: [debtTable.userId],
    references: [user.id],
  }),
  payments: many(debtPaymentTable),
}));

export const debtPaymentRelations = relations(debtPaymentTable, ({ one }) => ({
  user: one(user, {
    fields: [debtPaymentTable.userId],
    references: [user.id],
  }),
  debt: one(debtTable, {
    fields: [debtPaymentTable.debtId],
    references: [debtTable.id],
  }),
  account: one(financialAccountTable, {
    fields: [debtPaymentTable.accountId],
    references: [financialAccountTable.id],
  }),
  transaction: one(transactionTable, {
    fields: [debtPaymentTable.transactionId],
    references: [transactionTable.id],
  }),
}));

export const savingsGoalRelations = relations(
  savingsGoalTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [savingsGoalTable.userId],
      references: [user.id],
    }),
    contributions: many(savingsContributionTable),
  }),
);

export const savingsContributionRelations = relations(
  savingsContributionTable,
  ({ one }) => ({
    user: one(user, {
      fields: [savingsContributionTable.userId],
      references: [user.id],
    }),
    savingsGoal: one(savingsGoalTable, {
      fields: [savingsContributionTable.savingsGoalId],
      references: [savingsGoalTable.id],
    }),
    account: one(financialAccountTable, {
      fields: [savingsContributionTable.accountId],
      references: [financialAccountTable.id],
    }),
    transaction: one(transactionTable, {
      fields: [savingsContributionTable.transactionId],
      references: [transactionTable.id],
    }),
  }),
);

export const recurringTransactionRelations = relations(
  recurringTransactionTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [recurringTransactionTable.userId],
      references: [user.id],
    }),
    account: one(financialAccountTable, {
      fields: [recurringTransactionTable.accountId],
      references: [financialAccountTable.id],
    }),
    category: one(categoryTable, {
      fields: [recurringTransactionTable.categoryId],
      references: [categoryTable.id],
    }),
    creditCard: one(creditCardTable, {
      fields: [recurringTransactionTable.creditCardId],
      references: [creditCardTable.id],
    }),
    occurrences: many(transactionTable),
  }),
);
