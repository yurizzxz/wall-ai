import { z } from "zod";

import { assistantRateLimit } from "@/lib/assistant/assistant-rate-limit";
import { sendTelegramMessage } from "@/lib/telegram-client";
import { processAssistantMessage } from "@/modules/assistant/application/process-assistant-message";
import { createAssistantTools } from "@/services/assistant/create-assistant-tools";
import { redis } from "@/services/security/redis";
import { createTelegramAccountRepository } from "@/services/telegram/telegram-account-repository";

const UPDATE_EXPIRATION_SECONDS = 24 * 60 * 60;
const UPDATE_LOCK_SECONDS = 60;

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

type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

async function processTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;

  if (!message?.text || !message.from || message.chat.type !== "private") {
    return;
  }

  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from.id);
  const telegramAccounts = createTelegramAccountRepository();
  const startToken = message.text.startsWith("/start ")
    ? message.text.slice("/start ".length).trim()
    : null;

  if (startToken) {
    const linkKey = `wallai:telegram:link:${startToken}`;
    const userId = await redis.get<string>(linkKey);

    if (!userId) {
      const linkedUserId = await telegramAccounts.findUserIdByChatId(chatId);

      await sendTelegramMessage({
        chatId,
        text: linkedUserId
          ? "Este Telegram já está conectado ao WallAI."
          : "Este link expirou ou já foi utilizado.",
      });
      return;
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

    await redis.del(linkKey);
    return;
  }

  const userId = await telegramAccounts.findUserIdByChatId(chatId);

  if (!userId) {
    await sendTelegramMessage({
      chatId,
      text: "Conecte seu Telegram pelo painel do WallAI primeiro.",
    });
    return;
  }

  const rateLimit = await assistantRateLimit.limit(userId);

  if (!rateLimit.success) {
    await sendTelegramMessage({
      chatId,
      text: "Limite de solicitações atingido. Tente novamente mais tarde.",
    });
    return;
  }

  const response = await processAssistantMessage(
    {
      userId,
      message: message.text,
    },
    {
      createTools: createAssistantTools,
    },
  );

  await sendTelegramMessage({
    chatId,
    text: response,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (!webhookSecret || receivedSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = telegramUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ ok: true });
  }

  const updateId = parsed.data.update_id;
  const completedKey = `wallai:telegram:update:completed:${updateId}`;
  const lockKey = `wallai:telegram:update:lock:${updateId}`;

  if (await redis.get(completedKey)) {
    return Response.json({ ok: true });
  }

  const lockAcquired = await redis.set(lockKey, "1", {
    nx: true,
    ex: UPDATE_LOCK_SECONDS,
  });

  if (!lockAcquired) {
    return new Response("Update processing", { status: 503 });
  }

  try {
    await processTelegramUpdate(parsed.data);
    await redis.set(completedKey, "1", {
      ex: UPDATE_EXPIRATION_SECONDS,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Erro ao processar update do Telegram", {
      updateId,
      error,
    });

    return new Response("Internal server error", { status: 500 });
  } finally {
    await redis.del(lockKey).catch((error: unknown) => {
      console.error("Erro ao liberar lock do update do Telegram", {
        updateId,
        error,
      });
    });
  }
}
