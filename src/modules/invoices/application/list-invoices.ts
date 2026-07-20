import type { Invoice, InvoiceStatus } from "../domain/invoice";
import type { AmountInCents } from "../../shared/domain/money";

export type InvoiceListItem = Invoice & {
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  creditCardName: string;
  outstandingInCents: AmountInCents;
};

export type ListInvoicesInput = {
  userId: string;
  status?: InvoiceStatus;
};

export type ListInvoicesRepository = {
  listForUser(input: ListInvoicesInput): Promise<InvoiceListItem[]>;
};

export async function listInvoices(
  input: ListInvoicesInput,
  repository: ListInvoicesRepository,
): Promise<InvoiceListItem[]> {
  if (!input.userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listForUser(input);
}
