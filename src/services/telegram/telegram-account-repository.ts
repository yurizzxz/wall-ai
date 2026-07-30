import db from "@/db";
import { telegramAccountTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type LinkTelegramAccountInput = {
  userId: string;
  telegramUserId: string;
  telegramChatId: string;
  username?: string;
  firstName?: string;
};

export type TelegramAccountRepository = {
  findUserIdByChatId(chatId: string): Promise<string | null>;

  link(input: LinkTelegramAccountInput): Promise<void>;
};

export function createTelegramAccountRepository(): TelegramAccountRepository {
  return {
    async findUserIdByChatId(chatId) {
      const [connection] = await db
        .select({
          userId: telegramAccountTable.userId,
        })
        .from(telegramAccountTable)
        .where(eq(telegramAccountTable.telegramChatId, chatId))
        .limit(1);

      return connection?.userId ?? null;
    },

    async link(input) {
      await db.insert(telegramAccountTable).values(input);
    },
  };
}