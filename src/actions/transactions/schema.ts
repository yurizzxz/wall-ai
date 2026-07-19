import { z } from "zod";

export const createTransactionSchema = z.object({
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
  categoryId: z.uuid("Selecione uma categoria válida."),
  accountId: z.uuid("Selecione uma conta válida.").optional(),
  creditCardId: z.uuid("Selecione um cartão válido.").optional(),
  occurredAt: z.coerce.date("Informe uma data válida."),
  dueAt: z.coerce.date("Informe uma data de vencimento válida.").optional(),
});

export type CreateTransactionActionInput = z.infer<
  typeof createTransactionSchema
>;
