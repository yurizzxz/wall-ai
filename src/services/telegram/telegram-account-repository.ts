import db from "@/db";
import { telegramAccountTable } from "@/db/schema";
import { eq, or } from "drizzle-orm";

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
      await db.transaction(async (tx) => {
        await tx
          .delete(telegramAccountTable)
          .where(
            or(
              eq(telegramAccountTable.userId, input.userId),
              eq(telegramAccountTable.telegramUserId, input.telegramUserId),
              eq(telegramAccountTable.telegramChatId, input.telegramChatId),
            ),
          );

        await tx.insert(telegramAccountTable).values(input);
      });
    },
  };
}
