"use client";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton() {
  return (
    <button
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
    >
      Entrar com Google
    </button>
  );
}