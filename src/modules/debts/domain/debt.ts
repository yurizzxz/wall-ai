import {
  assertAmountInCents,
  assertPositiveAmountInCents,
  type AmountInCents,
} from "@/modules/shared/domain/money";

export type DebtStatus = "OPEN" | "OVERDUE" | "PAID" | "CANCELLED";

export type Debt = {
  id: string;
  userId: string;
  creditor: string;
  description: string;
  totalInCents: AmountInCents;
  paidInCents: AmountInCents;
  dueAt?: Date;
  status: DebtStatus;
};

export function calculateDebtOutstanding(
  debt: Pick<Debt, "totalInCents" | "paidInCents">,
): AmountInCents {
  assertAmountInCents(debt.totalInCents, "total da dívida");
  assertAmountInCents(debt.paidInCents, "total pago");
  return Math.max(0, debt.totalInCents - debt.paidInCents);
}

export function assertDebtPayment(
  debt: Debt,
  paymentInCents: AmountInCents,
): void {
  assertPositiveAmountInCents(paymentInCents, "pagamento");

  if (debt.status === "PAID" || debt.status === "CANCELLED") {
    throw new Error("Essa dívida não aceita novos pagamentos.");
  }

  if (paymentInCents > calculateDebtOutstanding(debt)) {
    throw new Error("O pagamento ultrapassa o saldo devedor.");
  }
}

export function deriveDebtStatus(
  debt: Pick<Debt, "totalInCents" | "paidInCents" | "dueAt" | "status">,
  now = new Date(),
): DebtStatus {
  if (debt.status === "CANCELLED") {
    return "CANCELLED";
  }

  if (calculateDebtOutstanding(debt) === 0) {
    return "PAID";
  }

  return debt.dueAt && now > debt.dueAt ? "OVERDUE" : "OPEN";
}
