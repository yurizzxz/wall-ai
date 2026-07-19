import { z } from "zod";

import {
  entityIdSchema,
  optionalDateSchema,
  positiveAmountInCentsSchema,
} from "@/actions/shared/schema";

export const createRecurrenceSchema = z
  .object({
    accountId: entityIdSchema.optional(),
    categoryId: entityIdSchema,
    creditCardId: entityIdSchema.optional(),
    description: z
      .string()
      .trim()
      .min(1, "Informe a descrição da recorrência.")
      .max(200, "A descrição deve ter no máximo 200 caracteres."),
    amountInCents: positiveAmountInCentsSchema,
    kind: z.enum(["INCOME", "EXPENSE"]),
    paymentMethod: z.enum([
      "CASH",
      "PIX",
      "DEBIT_CARD",
      "BANK_TRANSFER",
      "CREDIT_CARD",
    ]),
    frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
    nextOccurrenceAt: z.coerce.date("Informe a próxima ocorrência."),
    endsAt: optionalDateSchema,
  })
  .superRefine((input, context) => {
    if (input.endsAt && input.endsAt < input.nextOccurrenceAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "O término não pode vir antes da próxima ocorrência.",
      });
    }

    if (input.paymentMethod === "CREDIT_CARD") {
      if (input.kind !== "EXPENSE" || !input.creditCardId || input.accountId) {
        context.addIssue({
          code: "custom",
          path: ["creditCardId"],
          message: "Recorrência no crédito deve usar somente um cartão.",
        });
      }
    } else if (!input.accountId || input.creditCardId) {
      context.addIssue({
        code: "custom",
        path: ["accountId"],
        message: "Recorrência fora do crédito deve usar somente uma conta.",
      });
    }
  });

export const processRecurrenceSchema = z.object({
  recurrenceId: entityIdSchema,
});

export type CreateRecurrenceActionInput = z.infer<
  typeof createRecurrenceSchema
>;
