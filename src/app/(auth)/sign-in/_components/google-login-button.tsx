"use client";

import { useState } from "react";

import { GoogleIcon } from "@/app/(auth)/_components/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type GoogleSignInButtonProps = {
  label?: string;
};

export function GoogleSignInButton({
  label = "Entrar com Google",
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={signInWithGoogle}
    >
      {!isPending && <GoogleIcon className="size-4" />}
      {isPending ? "Redirecionando..." : label}
    </Button>
  );
}
