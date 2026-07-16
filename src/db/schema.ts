import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const accountTypeEnum = pgEnum("AccountType", [
  "CHECKING",
  "SAVINGS",
  "CASH",
  "INVESTMENT",
]);

export const categoryKindEnum = pgEnum("CategoryKind", [
  "INCOME",
  "EXPENSE",
  "BOTH",
]);

export const transactionKindEnum = pgEnum("TransactionKind", [
  "INCOME",
  "EXPENSE",
]);

export const transactionStatusEnum = pgEnum("TransactionStatus", [
  "PENDING",
  "SETTLED",
  "CANCELLED",
]);

export const paymentMethodEnum = pgEnum("PaymentMethod", [
  "CASH",
  "PIX",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "CREDIT_CARD",
]);

export const invoiceStatusEnum = pgEnum("InvoiceStatus", [
  "OPEN",
  "CLOSED",
  "OVERDUE",
  "PAID",
]);

export const debtStatusEnum = pgEnum("DebtStatus", [
  "OPEN",
  "OVERDUE",
  "PAID",
  "CANCELLED",
]);

export const savingsGoalStatusEnum = pgEnum("SavingsGoalStatus", [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const recurrenceFrequencyEnum = pgEnum("RecurrenceFrequency", [
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const userTable = pgTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email"),
    name: text("name"),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  (t) => ({
    clerkIdIdx: uniqueIndex("user_clerk_id_unique").on(t.clerkId),
    emailIdx: uniqueIndex("user_email_unique").on(t.email),
  }),
);

export const accountTable = pgTable(
  "account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    initialBalanceInCents: integer("initial_balance_in_cents")
      .default(0)
      .notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    userNameIdx: uniqueIndex("account_user_id_name_unique").on(
      t.userId,
      t.name,
    ),
    userActiveIdx: index("account_user_id_is_active_idx").on(
      t.userId,
      t.isActive,
    ),
    userIdIdx: uniqueIndex("account_user_id_id_unique").on(t.userId, t.id),
    initialBalanceChk: check(
      "account_initial_balance_non_negative_chk",
      sql`${t.initialBalanceInCents} >= 0`,
    ),
  }),
);

export const categoryTable = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    kind: categoryKindEnum("kind").notNull(),
    color: text("color"),
    icon: text("icon"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    userNameKindIdx: uniqueIndex("category_user_id_name_kind_unique").on(
      t.userId,
      t.name,
      t.kind,
    ),
    userActiveIdx: index("category_user_id_is_active_idx").on(
      t.userId,
      t.isActive,
    ),
    userIdIdx: uniqueIndex("category_user_id_id_unique").on(t.userId, t.id),
  }),
);

export const creditCardTable = pgTable(
  "credit_card",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    lastFour: varchar("last_four", { length: 4 }),
    limitInCents: integer("limit_in_cents").notNull(),
    closingDay: integer("closing_day").notNull(),
    dueDay: integer("due_day").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    userNameIdx: uniqueIndex("credit_card_user_id_name_unique").on(
      t.userId,
      t.name,
    ),
    userActiveIdx: index("credit_card_user_id_is_active_idx").on(
      t.userId,
      t.isActive,
    ),
    userIdIdx: uniqueIndex("credit_card_user_id_id_unique").on(t.userId, t.id),
    limitChk: check(
      "credit_card_limit_positive_chk",
      sql`${t.limitInCents} > 0`,
    ),
   
    closingDayRangeChk: check(
      "credit_card_closing_day_range_chk",
      sql`${t.closingDay} between 1 and 28`,
    ),
    dueDayRangeChk: check(
      "credit_card_due_day_range_chk",
      sql`${t.dueDay} between 1 and 28`,
    ),
  }),
);

export const invoiceTable = pgTable(
  "invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    creditCardId: uuid("credit_card_id")
      .notNull()
      .references(() => creditCardTable.id, { onDelete: "restrict" }),
    
    totalInCents: integer("total_in_cents").notNull().default(0),
    paidInCents: integer("paid_in_cents").notNull().default(0),
    status: invoiceStatusEnum("status").notNull().default("OPEN"),
    periodStart: timestamp("period_start", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    periodEnd: timestamp("period_end", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    closingAt: timestamp("closing_at", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, precision: 3 }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true, precision: 3 }),
    ...timestamps,
  },
  (t) => ({
    creditCardPeriodStartIdx: uniqueIndex(
      "invoice_credit_card_id_period_start_unique",
    ).on(t.creditCardId, t.periodStart),
    userStatusDueAtIdx: index("invoice_user_id_status_due_at_idx").on(
      t.userId,
      t.status,
      t.dueAt,
    ),
    userIdIdx: uniqueIndex("invoice_user_id_id_unique").on(t.userId, t.id),
    creditCardOwnerFk: foreignKey({
      columns: [t.userId, t.creditCardId],
      foreignColumns: [creditCardTable.userId, creditCardTable.id],
      name: "invoice_user_credit_card_fk",
    }).onDelete("restrict"),
    totalsChk: check(
      "invoice_totals_chk",
      sql`${t.totalInCents} >= 0 and ${t.paidInCents} >= 0 and ${t.paidInCents} <= ${t.totalInCents}`,
    ),
    periodChk: check(
      "invoice_period_chk",
      sql`${t.periodEnd} >= ${t.periodStart}`,
    ),
  }),
);

export const transactionTable = pgTable(
  "transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    accountId: uuid("account_id").references(() => accountTable.id, {
      onDelete: "restrict",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "restrict" }),
    creditCardId: uuid("credit_card_id").references(
      () => creditCardTable.id,
      { onDelete: "restrict" },
    ),
    paidInvoiceId: uuid("paid_invoice_id").references(
      () => invoiceTable.id,
      { onDelete: "restrict" },
    ),
   
    sourceRecurringTransactionId: uuid(
      "source_recurring_transaction_id",
    ).references(() => recurringTransactionTable.id, {
      onDelete: "restrict",
    }),
    description: text("description").notNull(),
    notes: text("notes"),
    amountInCents: integer("amount_in_cents").notNull(),
    kind: transactionKindEnum("kind").notNull(),
    status: transactionStatusEnum("status").notNull().default("PENDING"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, precision: 3 }),
    settledAt: timestamp("settled_at", { withTimezone: true, precision: 3 }),
    ...timestamps,
  },
  (t) => ({
    userOccurredAtIdx: index("transaction_user_id_occurred_at_idx").on(
      t.userId,
      t.occurredAt,
    ),
    userStatusDueAtIdx: index("transaction_user_id_status_due_at_idx").on(
      t.userId,
      t.status,
      t.dueAt,
    ),
    accountStatusIdx: index("transaction_account_id_status_idx").on(
      t.accountId,
      t.status,
    ),
    creditCardOccurredAtIdx: index(
      "transaction_credit_card_id_occurred_at_idx",
    ).on(t.creditCardId, t.occurredAt),
    sourceRecurringTransactionIdx: index(
      "transaction_source_recurring_transaction_id_idx",
    ).on(t.sourceRecurringTransactionId),
  }),
);

export const creditCardInstallmentTable = pgTable(
  "credit_card_installment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => transactionTable.id, { onDelete: "restrict" }),
    invoiceId: uuid("invoice_id").references(() => invoiceTable.id, {
      onDelete: "restrict",
    }),
    number: integer("number").notNull(),
    totalCount: integer("total_count").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    purchaseNumberIdx: uniqueIndex(
      "credit_card_installment_purchase_id_number_unique",
    ).on(t.purchaseId, t.number),
    invoiceIdx: index("credit_card_installment_invoice_id_idx").on(
      t.invoiceId,
    ),
    dueAtIdx: index("credit_card_installment_due_at_idx").on(t.dueAt),
  }),
);

export const debtTable = pgTable(
  "debt",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    creditor: text("creditor").notNull(),
    description: text("description").notNull(),
    totalInCents: integer("total_in_cents").notNull(),
    paidInCents: integer("paid_in_cents").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true, precision: 3 }),
    status: debtStatusEnum("status").notNull().default("OPEN"),
    ...timestamps,
  },
  (t) => ({
    userStatusDueAtIdx: index("debt_user_id_status_due_at_idx").on(
      t.userId,
      t.status,
      t.dueAt,
    ),
  }),
);

export const debtPaymentTable = pgTable(
  "debt_payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    debtId: uuid("debt_id")
      .notNull()
      .references(() => debtTable.id, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accountTable.id, { onDelete: "restrict" }),
    transactionId: uuid("transaction_id").references(
      () => transactionTable.id,
      { onDelete: "restrict" },
    ),
    amountInCents: integer("amount_in_cents").notNull(),
    paidAt: timestamp("paid_at", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    transactionIdx: uniqueIndex("debt_payment_transaction_id_unique").on(
      t.transactionId,
    ),
    debtPaidAtIdx: index("debt_payment_debt_id_paid_at_idx").on(
      t.debtId,
      t.paidAt,
    ),
    userPaidAtIdx: index("debt_payment_user_id_paid_at_idx").on(
      t.userId,
      t.paidAt,
    ),
  }),
);

export const savingsGoalTable = pgTable(
  "savings_goal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    targetInCents: integer("target_in_cents").notNull(),
    savedInCents: integer("saved_in_cents").notNull().default(0),
    deadline: timestamp("deadline", { withTimezone: true, precision: 3 }),
    status: savingsGoalStatusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => ({
    userNameIdx: uniqueIndex("savings_goal_user_id_name_unique").on(
      t.userId,
      t.name,
    ),
    userStatusDeadlineIdx: index(
      "savings_goal_user_id_status_deadline_idx",
    ).on(t.userId, t.status, t.deadline),
  }),
);

export const savingsContributionTable = pgTable(
  "savings_contribution",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    savingsGoalId: uuid("savings_goal_id")
      .notNull()
      .references(() => savingsGoalTable.id, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accountTable.id, { onDelete: "restrict" }),
    transactionId: uuid("transaction_id").references(
      () => transactionTable.id,
      { onDelete: "restrict" },
    ),
    amountInCents: integer("amount_in_cents").notNull(),
    contributedAt: timestamp("contributed_at", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    transactionIdx: uniqueIndex(
      "savings_contribution_transaction_id_unique",
    ).on(t.transactionId),
    goalContributedAtIdx: index(
      "savings_contribution_goal_id_contributed_at_idx",
    ).on(t.savingsGoalId, t.contributedAt),
    userContributedAtIdx: index(
      "savings_contribution_user_id_contributed_at_idx",
    ).on(t.userId, t.contributedAt),
  }),
);

export const recurringTransactionTable = pgTable(
  "recurring_transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    accountId: uuid("account_id").references(() => accountTable.id, {
      onDelete: "restrict",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "restrict" }),
    creditCardId: uuid("credit_card_id").references(
      () => creditCardTable.id,
      { onDelete: "restrict" },
    ),
    description: text("description").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    kind: transactionKindEnum("kind").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    frequency: recurrenceFrequencyEnum("frequency").notNull(),
    nextOccurrenceAt: timestamp("next_occurrence_at", {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, precision: 3 }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    userActiveNextIdx: index(
      "recurring_transaction_user_active_next_idx",
    ).on(t.userId, t.isActive, t.nextOccurrenceAt),
  }),
);

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;

export type Account = typeof accountTable.$inferSelect;
export type NewAccount = typeof accountTable.$inferInsert;

export type Category = typeof categoryTable.$inferSelect;
export type NewCategory = typeof categoryTable.$inferInsert;

export type CreditCard = typeof creditCardTable.$inferSelect;
export type NewCreditCard = typeof creditCardTable.$inferInsert;

export type Invoice = typeof invoiceTable.$inferSelect;
export type NewInvoice = typeof invoiceTable.$inferInsert;

export type Transaction = typeof transactionTable.$inferSelect;
export type NewTransaction = typeof transactionTable.$inferInsert;

export type CreditCardInstallment =
  typeof creditCardInstallmentTable.$inferSelect;
export type NewCreditCardInstallment =
  typeof creditCardInstallmentTable.$inferInsert;

export type Debt = typeof debtTable.$inferSelect;
export type NewDebt = typeof debtTable.$inferInsert;

export type DebtPayment = typeof debtPaymentTable.$inferSelect;
export type NewDebtPayment = typeof debtPaymentTable.$inferInsert;

export type SavingsGoal = typeof savingsGoalTable.$inferSelect;
export type NewSavingsGoal = typeof savingsGoalTable.$inferInsert;

export type SavingsContribution =
  typeof savingsContributionTable.$inferSelect;
export type NewSavingsContribution =
  typeof savingsContributionTable.$inferInsert;

export type RecurringTransaction =
  typeof recurringTransactionTable.$inferSelect;
export type NewRecurringTransaction =
  typeof recurringTransactionTable.$inferInsert;
