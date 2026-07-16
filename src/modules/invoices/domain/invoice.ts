import {
  assertAmountInCents,
  assertPositiveAmountInCents,
  type AmountInCents,
} from "@/modules/shared/domain/money";

export type InvoiceStatus = "OPEN" | "CLOSED" | "OVERDUE" | "PAID";

export type Invoice = {
  id: string;
  userId: string;
  creditCardId: string;
  totalInCents: AmountInCents;
  paidInCents: AmountInCents;
  status: InvoiceStatus;
  closingAt: Date;
  dueAt: Date;
};

export function calculateInvoiceOutstanding(
  invoice: Pick<Invoice, "totalInCents" | "paidInCents">,
): AmountInCents {
  assertAmountInCents(invoice.totalInCents, "total da fatura");
  assertAmountInCents(invoice.paidInCents, "total pago");
  return Math.max(0, invoice.totalInCents - invoice.paidInCents);
}

export function assertInvoiceCanBePaid(
  invoice: Invoice,
  paymentInCents: AmountInCents,
): void {
  assertPositiveAmountInCents(paymentInCents, "pagamento");

  if (invoice.status === "OPEN") {
    throw new Error("A fatura precisa estar fechada antes do pagamento.");
  }

  if (invoice.status === "PAID") {
    throw new Error("A fatura já está paga.");
  }

  if (paymentInCents > calculateInvoiceOutstanding(invoice)) {
    throw new Error("O pagamento não pode ultrapassar o saldo da fatura.");
  }
}

export function deriveInvoiceStatus(
  invoice: Pick<Invoice, "totalInCents" | "paidInCents" | "closingAt" | "dueAt">,
  now = new Date(),
): InvoiceStatus {
  if (calculateInvoiceOutstanding(invoice) === 0) {
    return "PAID";
  }

  if (now > invoice.dueAt) {
    return "OVERDUE";
  }

  return now >= invoice.closingAt ? "CLOSED" : "OPEN";
}
