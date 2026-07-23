"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { signInSchema, type SignInInput } from "@/actions/auth/schema";
import { GoogleSignInButton } from "@/app/(auth)/sign-in/_components/google-login-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(input: SignInInput) {
    form.clearErrors("root");

    const { error } = await authClient.signIn.email(input);

    if (error) {
      form.setError("root", {
        type: "server",
        message: "E-mail ou senha inválidos.",
      });

      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  const isPending = form.formState.isSubmitting;

  return (
    <div className="space-y-5">
      <GoogleSignInButton />

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou continue com e-mail</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email?.message && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password?.message && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {form.formState.errors.root?.message && (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ainda não possui conta?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
