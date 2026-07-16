import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateNextOccurrence,
  validateRecurrence,
} from "../../src/modules/recurrences/domain/recurrence";

describe("recurrence", () => {
  it("valida período da recorrência", () => {
    const recurrence = {
      id: "recurrence-1",
      userId: "user-1",
      description: "Salário",
      amountInCents: 500_000,
      kind: "INCOME" as const,
      paymentMethod: "BANK_TRANSFER" as const,
      frequency: "MONTHLY" as const,
      nextOccurrenceAt: new Date("2026-07-05T12:00:00Z"),
      endsAt: new Date("2026-12-05T12:00:00Z"),
      isActive: true,
    };

    assert.equal(validateRecurrence(recurrence).description, "Salário");
    assert.throws(
      () =>
        validateRecurrence({
          ...recurrence,
          endsAt: new Date("2026-06-05T12:00:00Z"),
        }),
      /não pode vir antes/,
    );
  });

  it("calcula próxima ocorrência semanal, mensal e anual", () => {
    assert.equal(
      calculateNextOccurrence(
        new Date("2026-07-01T12:00:00Z"),
        "WEEKLY",
      ).toISOString(),
      "2026-07-08T12:00:00.000Z",
    );
    assert.equal(
      calculateNextOccurrence(
        new Date("2026-07-05T12:00:00Z"),
        "MONTHLY",
      ).toISOString(),
      "2026-08-05T12:00:00.000Z",
    );
    assert.equal(
      calculateNextOccurrence(
        new Date("2026-07-05T12:00:00Z"),
        "YEARLY",
      ).toISOString(),
      "2027-07-05T12:00:00.000Z",
    );
  });

  it("ajusta recorrência para último dia de mês curto", () => {
    assert.equal(
      calculateNextOccurrence(
        new Date("2026-01-31T12:00:00Z"),
        "MONTHLY",
      ).toISOString(),
      "2026-02-28T12:00:00.000Z",
    );
    assert.equal(
      calculateNextOccurrence(
        new Date("2024-02-29T12:00:00Z"),
        "YEARLY",
      ).toISOString(),
      "2025-02-28T12:00:00.000Z",
    );
  });
});
