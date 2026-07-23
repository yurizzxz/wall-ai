import type { Metadata } from "next";

import { AuthCard } from "@/app/(auth)/_components/auth-card";
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Wallai.",
};

export default function SignInPage() {
  return (
    <AuthCard
      title="Acesse sua conta"
      description="Entre para acompanhar sua vida financeira."
    >
      <SignInForm />
    </AuthCard>
  );
}
