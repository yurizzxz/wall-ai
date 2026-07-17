"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  signInSchema,
  signUpSchema,
} from "@/actions/auth/schema";

export type AuthActionResult =
  | {
      ok: false;
      error: "INVALID_INPUT" | "INVALID_CREDENTIALS" | "ACCOUNT_CREATION_FAILED";
      message: string;
    }
  | null;

export async function signInAction(
  rawInput: unknown,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      message: "Verifique os dados informados.",
    };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error: unknown) {
    if (isAPIError(error)) {
      return {
        ok: false,
        error: "INVALID_CREDENTIALS",
        message: "E-mail ou senha inválidos.",
      };
    }

    throw error;
  }

  redirect("/");
}

export async function signUpAction(
  rawInput: unknown,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      message: "Verifique os dados informados.",
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch (error: unknown) {
    if (isAPIError(error)) {
      return {
        ok: false,
        error: "ACCOUNT_CREATION_FAILED",
        message: "Não foi possível criar sua conta.",
      };
    }

    throw error;
  }

  redirect("/");
}
