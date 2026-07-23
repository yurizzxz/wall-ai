import { z } from "zod";

import { entityIdSchema, optionalDateSchema } from "@/actions/shared/schema";

export const createTransactionSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Informe a descrição do lançamento.")
      .max(200, "A descrição deve ter no máximo 200 caracteres."),
    amountInCents: z.coerce
      .number()
      .int("O valor deve ser informado em centavos inteiros.")
      .positive("O valor deve ser maior que zero.")
      .max(Number.MAX_SAFE_INTEGER, "O valor informado é inválido."),
    kind: z.enum(["INCOME", "EXPENSE"]),
    status: z.enum(["PENDING", "SETTLED"]),
    paymentMethod: z.enum([
      "CASH",
      "PIX",
      "DEBIT_CARD",
      "BANK_TRANSFER",
      "CREDIT_CARD",
    ]),
    categoryId: entityIdSchema,
    accountId: entityIdSchema.optional(),
    creditCardId: entityIdSchema.optional(),
    occurredAt: z.coerce.date("Informe uma data válida."),
    dueAt: optionalDateSchema,
    installmentCount: z.coerce
      .number()
      .int("A quantidade de parcelas deve ser um número inteiro.")
      .min(1, "Selecione ao menos uma parcela.")
      .max(48, "O parcelamento pode ter no máximo 48 parcelas.")
      .default(1),
  })
  .superRefine((input, context) => {
    if (input.paymentMethod === "CREDIT_CARD") {
      if (input.kind !== "EXPENSE") {
        context.addIssue({
          code: "custom",
          path: ["kind"],
          message: "Cartão de crédito aceita somente despesas.",
        });
      }

      if (!input.creditCardId) {
        context.addIssue({
          code: "custom",
          path: ["creditCardId"],
          message: "Selecione o cartão de crédito.",
        });
      }

      if (input.accountId) {
        context.addIssue({
          code: "custom",
          path: ["accountId"],
          message: "Compra no crédito não movimenta uma conta diretamente.",
        });
      }
    } else {
      if (!input.accountId) {
        context.addIssue({
          code: "custom",
          path: ["accountId"],
          message: "Selecione a conta movimentada.",
        });
      }

      if (input.creditCardId) {
        context.addIssue({
          code: "custom",
          path: ["creditCardId"],
          message: "Somente compras no crédito podem indicar um cartão.",
        });
      }

      if (input.installmentCount !== 1) {
        context.addIssue({
          code: "custom",
          path: ["installmentCount"],
          message: "Parcelamento está disponível somente no cartão de crédito.",
        });
      }
    }
  });

export const updateTransactionSchema = z.object({
  transactionId: entityIdSchema,
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição do lançamento.")
    .max(200, "A descrição deve ter no máximo 200 caracteres."),
  categoryId: entityIdSchema,
});

export const cancelTransactionSchema = z.object({
  transactionId: entityIdSchema,
});

export type CreateTransactionActionInput = z.infer<
  typeof createTransactionSchema
>;
