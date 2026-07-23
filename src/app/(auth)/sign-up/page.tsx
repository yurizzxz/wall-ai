import type { Metadata } from "next";

import { AuthCard } from "@/app/(auth)/_components/auth-card";
import { SignUpForm } from "@/app/(auth)/sign-up/_components/sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta Wallai e organize sua vida financeira.",
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Crie sua conta"
      description="Comece a organizar sua vida financeira em poucos passos."
    >
      <SignUpForm />
    </AuthCard>
  );
}
