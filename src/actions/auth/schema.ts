// src/lib/validations/auth.ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(24, "A senha pode ter no máximo 24 caracteres."),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome.")
      .max(100, "Nome muito longo."),

    email: z.email("Informe um e-mail válido."),

    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .max(24, "A senha pode ter no máximo 24 caracteres."),

    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
