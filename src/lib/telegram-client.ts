import "server-only";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN não configurado.");
}

const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

type SendMessageInput = {
  chatId: string;
  text: string;
};

export async function sendTelegramMessage({
  chatId,
  text,
}: SendMessageInput): Promise<void> {
  const response = await fetch(`${telegramApiUrl}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram respondeu com status ${response.status}.`);
  }
}