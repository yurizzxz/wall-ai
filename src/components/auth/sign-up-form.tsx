"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { signUpAction } from "@/actions/auth";
import {
  signUpSchema,
  type SignUpInput,
} from "@/actions/auth/schema";

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(input: SignUpInput) {
    startTransition(async () => {
      const result = await signUpAction(input);

      if (result?.ok === false) {
        form.setError("root", { message: result.message });
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="rounded-md border px-3 py-2"
          {...form.register("name")}
        />
        {form.formState.errors.name?.message && (
          <p className="text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border px-3 py-2"
          {...form.register("email")}
        />
        {form.formState.errors.email?.message && (
          <p className="text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="rounded-md border px-3 py-2"
          {...form.register("password")}
        />
        {form.formState.errors.password?.message && (
          <p className="text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword">Confirmar senha</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="rounded-md border px-3 py-2"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword?.message && (
          <p className="text-sm text-red-600">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {form.formState.errors.root?.message && (
        <p className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isPending ? "Criando..." : "Criar conta"}
      </button>

      <p className="text-sm">
        Já possui conta? <Link href="/sign-in">Entrar</Link>
      </p>
    </form>
  );
}
