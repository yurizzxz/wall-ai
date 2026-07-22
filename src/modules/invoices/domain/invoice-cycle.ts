export type InvoiceCycle = {
  periodStart: Date;
  periodEnd: Date;
  closingAt: Date;
  dueAt: Date;
};

type CalculateInvoiceCycleInput = {
  occurredAt: Date;
  closingDay: number;
  dueDay: number;
  monthOffset?: number;
};

function utcDate(year: number, month: number, day: number, endOfDay = false) {
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    ),
  );
}

export function calculateInvoiceCycle({
  occurredAt,
  closingDay,
  dueDay,
  monthOffset = 0,
}: CalculateInvoiceCycleInput): InvoiceCycle {
  const purchaseYear = occurredAt.getUTCFullYear();
  const purchaseMonth = occurredAt.getUTCMonth();
  const currentClosingAt = utcDate(purchaseYear, purchaseMonth, closingDay, true);
  const firstClosingMonth = occurredAt <= currentClosingAt
    ? purchaseMonth
    : purchaseMonth + 1;
  const closingAt = utcDate(
    purchaseYear,
    firstClosingMonth + monthOffset,
    closingDay,
    true,
  );
  const previousClosingAt = utcDate(
    closingAt.getUTCFullYear(),
    closingAt.getUTCMonth() - 1,
    closingDay,
    true,
  );
  const periodStart = new Date(previousClosingAt.getTime() + 1);
  const dueMonth = dueDay > closingDay
    ? closingAt.getUTCMonth()
    : closingAt.getUTCMonth() + 1;
  const dueAt = utcDate(closingAt.getUTCFullYear(), dueMonth, dueDay, true);

  return {
    periodStart,
    periodEnd: closingAt,
    closingAt,
    dueAt,
  };
}
