import type { AccountType } from "@/modules/accounts/domain/account";
import type {
  PaymentMethod,
  TransactionStatus,
} from "@/modules/transactions/domain/transaction";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatCompactCurrency(cents: number) {
  return compactCurrencyFormatter.format(cents / 100);
}

export const KIND_LABELS = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
} satisfies Record<"INCOME" | "EXPENSE", string>;

export const ACCOUNT_TYPE_LABELS = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  CASH: "Dinheiro",
  INVESTMENT: "Investimentos",
} satisfies Record<AccountType, string>;

export const PAYMENT_METHODS = [
  ["PIX", "Pix"],
  ["CASH", "Dinheiro"],
  ["DEBIT_CARD", "Cartão de débito"],
  ["BANK_TRANSFER", "Transferência bancária"],
  ["CREDIT_CARD", "Cartão de crédito"],
] as const;

export const PAYMENT_METHOD_LABELS = {
  PIX: "Pix",
  CASH: "Dinheiro",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência bancária",
  CREDIT_CARD: "Cartão de crédito",
} satisfies Record<PaymentMethod, string>;

export const TRANSACTION_STATUS_LABELS = {
  PENDING: "Pendente",
  SETTLED: "Liquidado",
  CANCELLED: "Cancelado",
} satisfies Record<TransactionStatus, string>;

export const FREQUENCY_LABELS = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
} satisfies Record<"WEEKLY" | "MONTHLY" | "YEARLY", string>;

export const CATEGORY_KIND_LABELS = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  BOTH: "Receita e despesa",
} satisfies Record<"INCOME" | "EXPENSE" | "BOTH", string>;