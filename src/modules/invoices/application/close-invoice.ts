import type { Invoice } from "../domain/invoice";

export type CloseInvoiceInput = {
  userId: string;
  invoiceId: string;
};

export type CloseInvoiceDependencies = {
  invoices: {
    findById(userId: string, invoiceId: string): Promise<Invoice | null>;
    close(userId: string, invoiceId: string): Promise<Invoice>;
  };
  now(): Date;
};

export async function closeInvoice(
  input: CloseInvoiceInput,
  dependencies: CloseInvoiceDependencies,
): Promise<Invoice> {
  const invoice = await dependencies.invoices.findById(
    input.userId,
    input.invoiceId,
  );

  if (!invoice) {
    throw new Error("Fatura não encontrada para esse usuário.");
  }

  if (invoice.status !== "OPEN") {
    throw new Error("Somente uma fatura aberta pode ser fechada.");
  }

  if (dependencies.now() < invoice.closingAt) {
    throw new Error("A data de fechamento da fatura ainda não chegou.");
  }

  return dependencies.invoices.close(input.userId, input.invoiceId);
}
