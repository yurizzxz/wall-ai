import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import type { AmountInCents } from "../../shared/domain/money";
import {
  assertCategoryAcceptsTransaction,
  type Category,
} from "../../categories/domain/category";
import type { AccountPaymentMethod } from "../../transactions/domain/transaction";
import {
  assertInvoiceCanBePaid,
  deriveInvoiceStatus,
  type Invoice,
  type InvoiceStatus,
} from "../domain/invoice";

export type PayInvoiceInput = {
  userId: string;
  invoiceId: string;
  accountId: string;
  categoryId: string;
  amountInCents: AmountInCents;
  paymentMethod: AccountPaymentMethod;
};

export type ApplyInvoicePaymentInput = PayInvoiceInput & {
  description: string;
  expectedPaidInCents: AmountInCents;
  nextPaidInCents: AmountInCents;
  nextStatus: InvoiceStatus;
  paidAt: Date;
};

export type PayInvoiceDependencies = {
  invoices: {
    findById(userId: string, invoiceId: string): Promise<Invoice | null>;
    applyPayment(input: ApplyInvoicePaymentInput): Promise<Invoice>;
  };
  accounts: {
    findById(userId: string, accountId: string): Promise<Account | null>;
  };
  categories: {
    findById(userId: string, categoryId: string): Promise<Category | null>;
  };
  now(): Date;
};

export async function payInvoice(
  input: PayInvoiceInput,
  dependencies: PayInvoiceDependencies,
): Promise<Invoice> {
  const [invoice, account, category] = await Promise.all([
    dependencies.invoices.findById(input.userId, input.invoiceId),
    dependencies.accounts.findById(input.userId, input.accountId),
    dependencies.categories.findById(input.userId, input.categoryId),
  ]);

  if (!invoice) {
    throw new Error("Fatura não encontrada para esse usuário.");
  }

  if (!account) {
    throw new Error("Conta não encontrada para esse usuário.");
  }

  if (!category) {
    throw new Error("Categoria não encontrada para esse usuário.");
  }

  assertAccountCanReceiveMovements(account);
  assertCategoryAcceptsTransaction(category, "EXPENSE");
  assertInvoiceCanBePaid(invoice, input.amountInCents);

  const paidAt = dependencies.now();
  const nextPaidInCents = invoice.paidInCents + input.amountInCents;
  const nextStatus = deriveInvoiceStatus(
    { ...invoice, paidInCents: nextPaidInCents },
    paidAt,
  );

  return dependencies.invoices.applyPayment({
    ...input,
    description: "Pagamento de fatura",
    expectedPaidInCents: invoice.paidInCents,
    nextPaidInCents,
    nextStatus,
    paidAt,
  });
}
