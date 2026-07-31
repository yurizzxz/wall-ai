"use server";

import { randomBytes } from "node:crypto";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { redis } from "@/services/security/redis";

const LINK_EXPIRATION_SECONDS = 10 * 60;

export const createTelegramLinkAction = authenticatedAction.action(
  async ({ ctx }) => {
    try {
      await enforceRateLimit(ctx.user.id);

      const token = randomBytes(24).toString("base64url");
      const botUsername = process.env.TELEGRAM_BOT_USERNAME
        ?.trim()
        .replace(/^@/, "");

      if (!botUsername) {
        throw new Error("TELEGRAM_BOT_USERNAME não configurado.");
      }

      await redis.set(
        `wallai:telegram:link:${token}`,
        ctx.user.id,
        {
          ex: LINK_EXPIRATION_SECONDS,
        },
      );

      return {
        ok: true as const,
        appUrl: `tg://resolve?domain=${encodeURIComponent(botUsername)}&start=${encodeURIComponent(token)}`,
        webUrl: `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(token)}`,
      };
    } catch (error) {
      console.error("Erro ao gerar vínculo do Telegram", error);

      return {
        ok: false as const,
        message: "Não foi possível gerar o vínculo com o Telegram.",
      };
    }
  },
);
