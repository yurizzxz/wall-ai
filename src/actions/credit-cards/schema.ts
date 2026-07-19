import { z } from "zod";

import {
  entityIdSchema,
  positiveAmountInCentsSchema,
} from "@/actions/shared/schema";

const lastFourSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Informe exatamente os quatro últimos dígitos.")
    .optional(),
);

export const createCreditCardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do cartão.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  lastFour: lastFourSchema,
  limitInCents: positiveAmountInCentsSchema,
  closingDay: z.coerce.number().int().min(1).max(28),
  dueDay: z.coerce.number().int().min(1).max(28),
});

export const deactivateCreditCardSchema = z.object({
  creditCardId: entityIdSchema,
});

export type CreateCreditCardActionInput = z.infer<
  typeof createCreditCardSchema
>;
