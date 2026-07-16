import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import type { AmountInCents } from "../../shared/domain/money";
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
  amountInCents: AmountInCents;
};

export type ApplyInvoicePaymentInput = PayInvoiceInput & {
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
  now(): Date;
};

export async function payInvoice(
  input: PayInvoiceInput,
  dependencies: PayInvoiceDependencies,
): Promise<Invoice> {
  const [invoice, account] = await Promise.all([
    dependencies.invoices.findById(input.userId, input.invoiceId),
    dependencies.accounts.findById(input.userId, input.accountId),
  ]);

  if (!invoice) {
    throw new Error("Fatura não encontrada para esse usuário.");
  }

  if (!account) {
    throw new Error("Conta não encontrada para esse usuário.");
  }

  assertAccountCanReceiveMovements(account);
  assertInvoiceCanBePaid(invoice, input.amountInCents);

  const paidAt = dependencies.now();
  const nextPaidInCents = invoice.paidInCents + input.amountInCents;
  const nextStatus = deriveInvoiceStatus(
    { ...invoice, paidInCents: nextPaidInCents },
    paidAt,
  );

  return dependencies.invoices.applyPayment({
    ...input,
    nextPaidInCents,
    nextStatus,
    paidAt,
  });
}
