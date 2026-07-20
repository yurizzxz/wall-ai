import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { financialAccountTable, transactionTable } from "@/db/schema";
import type {
  AccountRepository,
  CreateAccountInput,
} from "@/modules/accounts/application/create-account";
import type {
  AccountListItem,
  ListAccountsRepository,
} from "@/modules/accounts/application/list-accounts";
import type { Account } from "@/modules/accounts/domain/account";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type DrizzleAccountRepository = AccountRepository & {
  findById(userId: string, accountId: string): Promise<Account | null>;
  list(): Promise<Account[]>;
  hasPendingTransactions(userId: string, accountId: string): Promise<boolean>;
  setActive(userId: string, accountId: string, isActive: boolean): Promise<Account>;
} & ListAccountsRepository;

export function createAccountRepository(
  authenticatedUserId: string,
): DrizzleAccountRepository {
  return {
    async findById(userId, accountId) {
      assertUserScope(authenticatedUserId, userId);

      const [account] = await db
        .select()
        .from(financialAccountTable)
        .where(
          and(
            eq(financialAccountTable.id, accountId),
            eq(financialAccountTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return account ?? null;
    },

    async findByName(userId, name) {
      assertUserScope(authenticatedUserId, userId);

      const [account] = await db
        .select()
        .from(financialAccountTable)
        .where(
          and(
            eq(financialAccountTable.userId, authenticatedUserId),
            eq(financialAccountTable.name, name),
          ),
        )
        .limit(1);

      return account ?? null;
    },

    async list() {
      return db
        .select()
        .from(financialAccountTable)
        .where(eq(financialAccountTable.userId, authenticatedUserId))
        .orderBy(asc(financialAccountTable.name));
    },

    async listWithBalance(userId): Promise<AccountListItem[]> {
      assertUserScope(authenticatedUserId, userId);

      const accounts = await db
        .select({
          id: financialAccountTable.id,
          userId: financialAccountTable.userId,
          name: financialAccountTable.name,
          type: financialAccountTable.type,
          currency: financialAccountTable.currency,
          initialBalanceInCents: financialAccountTable.initialBalanceInCents,
          isActive: financialAccountTable.isActive,
          balanceInCents: sql<number>`
            ${financialAccountTable.initialBalanceInCents}
            + coalesce(sum(
              case
                when ${transactionTable.status} = 'SETTLED'
                  and ${transactionTable.paymentMethod} <> 'CREDIT_CARD'
                then case
                  when ${transactionTable.kind} = 'INCOME'
                    then ${transactionTable.amountInCents}
                  else -${transactionTable.amountInCents}
                end
                else 0
              end
            ), 0)
          `,
        })
        .from(financialAccountTable)
        .leftJoin(
          transactionTable,
          and(
            eq(transactionTable.accountId, financialAccountTable.id),
            eq(transactionTable.userId, authenticatedUserId),
          ),
        )
        .where(eq(financialAccountTable.userId, authenticatedUserId))
        .groupBy(
          financialAccountTable.id,
          financialAccountTable.userId,
          financialAccountTable.name,
          financialAccountTable.type,
          financialAccountTable.currency,
          financialAccountTable.initialBalanceInCents,
          financialAccountTable.isActive,
        )
        .orderBy(asc(financialAccountTable.name));

      return accounts.map((account) => ({
        ...account,
        balanceInCents: Number(account.balanceInCents),
      }));
    },

    async hasPendingTransactions(userId, accountId) {
      assertUserScope(authenticatedUserId, userId);

      const [transaction] = await db
        .select({ id: transactionTable.id })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, authenticatedUserId),
            eq(transactionTable.accountId, accountId),
            eq(transactionTable.status, "PENDING"),
          ),
        )
        .limit(1);

      return Boolean(transaction);
    },

    async setActive(userId, accountId, isActive) {
      assertUserScope(authenticatedUserId, userId);

      const [account] = await db
        .update(financialAccountTable)
        .set({ isActive })
        .where(
          and(
            eq(financialAccountTable.id, accountId),
            eq(financialAccountTable.userId, authenticatedUserId),
          ),
        )
        .returning();

      if (!account) {
        throw new Error("Conta não encontrada.");
      }

      return account;
    },

    async create(input: CreateAccountInput) {
      assertUserScope(authenticatedUserId, input.userId);

      const [account] = await db
        .insert(financialAccountTable)
        .values({
          userId: authenticatedUserId,
          name: input.name,
          type: input.type,
          initialBalanceInCents: input.initialBalanceInCents,
        })
        .returning();

      if (!account) {
        throw new Error("Não foi possível criar a conta.");
      }

      return account;
    },
  };
}
