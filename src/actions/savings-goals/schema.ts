import { z } from "zod";

import {
  entityIdSchema,
  optionalDateSchema,
  positiveAmountInCentsSchema,
} from "@/actions/shared/schema";

export const createSavingsGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do cofrinho.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  targetInCents: positiveAmountInCentsSchema,
  deadline: optionalDateSchema,
});

export const contributeToSavingsGoalSchema = z.object({
  savingsGoalId: entityIdSchema,
  accountId: entityIdSchema,
  categoryId: entityIdSchema,
  amountInCents: positiveAmountInCentsSchema,
});

export type CreateSavingsGoalActionInput = z.infer<
  typeof createSavingsGoalSchema
>;
export type ContributeToSavingsGoalActionInput = z.infer<
  typeof contributeToSavingsGoalSchema
>;
