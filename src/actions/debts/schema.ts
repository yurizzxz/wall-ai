import { z } from "zod";

import {
  accountPaymentMethodSchema,
  entityIdSchema,
  optionalDateSchema,
  positiveAmountInCentsSchema,
} from "@/actions/shared/schema";

export const createDebtSchema = z.object({
  creditor: z
    .string()
    .trim()
    .min(1, "Informe o credor.")
    .max(100, "O credor deve ter no máximo 100 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição da dívida.")
    .max(200, "A descrição deve ter no máximo 200 caracteres."),
  totalInCents: positiveAmountInCentsSchema,
  dueAt: optionalDateSchema,
});

export const payDebtSchema = z.object({
  debtId: entityIdSchema,
  accountId: entityIdSchema,
  categoryId: entityIdSchema,
  amountInCents: positiveAmountInCentsSchema,
  paymentMethod: accountPaymentMethodSchema,
});

export type CreateDebtActionInput = z.infer<typeof createDebtSchema>;
export type PayDebtActionInput = z.infer<typeof payDebtSchema>;
