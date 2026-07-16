import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAmountInCents,
  assertPositiveAmountInCents,
  sumAmounts,
} from "../../src/modules/shared/domain/money";

describe("money", () => {
  it("aceita somente centavos inteiros e seguros", () => {
    assert.equal(assertAmountInCents(1250), 1250);
    assert.throws(() => assertAmountInCents(12.5), /centavos inteiros/);
    assert.throws(() => assertAmountInCents(-1), /não pode ser negativo/);
    assert.throws(
      () => assertAmountInCents(Number.MAX_SAFE_INTEGER + 1),
      /centavos inteiros/,
    );
  });

  it("exige valor positivo quando zero não é permitido", () => {
    assert.equal(assertPositiveAmountInCents(1), 1);
    assert.throws(() => assertPositiveAmountInCents(0), /maior que zero/);
  });

  it("soma valores sem perder centavos", () => {
    assert.equal(sumAmounts([334, 333, 333]), 1000);
  });
});
