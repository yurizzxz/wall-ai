import { z } from "zod";

const optionalLabelSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(50, "O valor deve ter no máximo 50 caracteres.").optional(),
);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da categoria.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  kind: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: optionalLabelSchema,
  icon: optionalLabelSchema,
});

export type CreateCategoryActionInput = z.infer<typeof createCategorySchema>;
