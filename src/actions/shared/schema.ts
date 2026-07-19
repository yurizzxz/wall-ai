import { z } from "zod";

export const entityIdSchema = z.uuid("Selecione um registro válido.");

export const positiveAmountInCentsSchema = z.coerce
  .number()
  .int("O valor deve ser informado em centavos inteiros.")
  .positive("O valor deve ser maior que zero.")
  .max(Number.MAX_SAFE_INTEGER, "O valor informado é inválido.");

export const accountPaymentMethodSchema = z.enum([
  "CASH",
  "PIX",
  "DEBIT_CARD",
  "BANK_TRANSFER",
]);

export const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date("Informe uma data válida.").optional(),
);
