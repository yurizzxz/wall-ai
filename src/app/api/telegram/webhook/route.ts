import { z } from "zod";

import { assistantRateLimit } from "@/lib/assistant/assistant-rate-limit";
import { sendTelegramMessage } from "@/lib/telegram-client";
import { processAssistantMessage } from "@/modules/assistant/application/process-assistant-message";
import { redis } from "@/services/security/redis";
import { createTelegramAccountRepository } from "@/services/telegram/telegram-account-repository";

const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({
        id: z.number(),
        type: z.string(),
      }),
      from: z
        .object({
          id: z.number(),
          username: z.string().optional(),
          first_name: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (receivedSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = telegramUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json({ ok: true });
  }

  const update = parsed.data;

  const accepted = await redis.set(
    `wallai:telegram:update:${update.update_id}`,
    "1",
    {
      nx: true,
      ex: 86_400,
    },
  );

  if (!accepted) {
    return Response.json({ ok: true });
  }

  const message = parsed.data.message;

  if (!message?.text || !message.from || message.chat.type !== "private") {
    return Response.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from.id);
  const telegramAccounts = createTelegramAccountRepository();

  const startToken = message.text.startsWith("/start ")
    ? message.text.slice("/start ".length).trim()
    : null;

  if (startToken) {
    const userId = await redis.getdel<string>(
      `wallai:telegram:link:${startToken}`,
    );

    if (!userId) {
      await sendTelegramMessage({
        chatId,
        text: "Este link expirou ou já foi utilizado.",
      });

      return Response.json({ ok: true });
    }

    await telegramAccounts.link({
      userId,
      telegramUserId,
      telegramChatId: chatId,
      username: message.from.username,
      firstName: message.from.first_name,
    });

    await sendTelegramMessage({
      chatId,
      text: "Telegram conectado ao WallAI com sucesso.",
    });

    return Response.json({ ok: true });
  }

  const userId = await telegramAccounts.findUserIdByChatId(chatId);

  if (!userId) {
    await sendTelegramMessage({
      chatId,
      text: "Conecte seu Telegram pelo painel do WallAI primeiro.",
    });

    return Response.json({ ok: true });
  }

  const rateLimit = await assistantRateLimit.limit(userId);

  if (!rateLimit.success) {
    await sendTelegramMessage({
      chatId,
      text: "Limite de solicitações atingido. Tente novamente mais tarde.",
    });

    return Response.json({ ok: true });
  }

  const response = await processAssistantMessage({
    message: message.text,
  });

  await sendTelegramMessage({
    chatId,
    text: response,
  });

  return Response.json({ ok: true });
}
