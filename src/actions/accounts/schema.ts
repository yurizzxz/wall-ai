import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da conta.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  type: z.enum(["CHECKING", "SAVINGS", "CASH", "INVESTMENT"]),
  initialBalanceInCents: z.coerce
    .number()
    .int("O saldo deve ser informado em centavos inteiros.")
    .nonnegative("O saldo inicial não pode ser negativo.")
    .max(Number.MAX_SAFE_INTEGER, "O saldo inicial é inválido."),
});

export type CreateAccountActionInput = z.infer<typeof createAccountSchema>;
