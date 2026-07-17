import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  creditCardTable,
  invoiceTable,
  transactionTable,
} from "@/db/schema";
import type { CreditCard } from "@/modules/credit-cards/domain/credit-card";
import type { AmountInCents } from "@/modules/shared/domain/money";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type CreateCreditCardInput = Omit<CreditCard, "id" | "isActive"> & {
  lastFour?: string;
};

type CreditCardWithCommittedAmount = {
  card: CreditCard;
  committedInCents: AmountInCents;
};

export function createCreditCardRepository(authenticatedUserId: string) {
  async function calculateCommittedAmount(
    creditCardId: string,
  ): Promise<AmountInCents> {
    const [invoiceTotal, unbilledTotal] = await Promise.all([
      db
        .select({
          total: sql<number>`coalesce(sum(${invoiceTable.totalInCents} - ${invoiceTable.paidInCents}), 0)`,
        })
        .from(invoiceTable)
        .where(
          and(
            eq(invoiceTable.userId, authenticatedUserId),
            eq(invoiceTable.creditCardId, creditCardId),
            ne(invoiceTable.status, "PAID"),
          ),
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${creditCardInstallmentTable.amountInCents}), 0)`,
        })
        .from(creditCardInstallmentTable)
        .innerJoin(
          transactionTable,
          eq(creditCardInstallmentTable.purchaseId, transactionTable.id),
        )
        .where(
          and(
            eq(transactionTable.userId, authenticatedUserId),
            eq(transactionTable.creditCardId, creditCardId),
            ne(transactionTable.status, "CANCELLED"),
            isNull(creditCardInstallmentTable.invoiceId),
          ),
        ),
    ]);

    return Number(invoiceTotal[0]?.total ?? 0) + Number(unbilledTotal[0]?.total ?? 0);
  }

  return {
    async findById(
      userId: string,
      creditCardId: string,
    ): Promise<CreditCardWithCommittedAmount | null> {
      assertUserScope(authenticatedUserId, userId);

      const [card] = await db
        .select()
        .from(creditCardTable)
        .where(
          and(
            eq(creditCardTable.id, creditCardId),
            eq(creditCardTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      if (!card) {
        return null;
      }

      return {
        card,
        committedInCents: await calculateCommittedAmount(card.id),
      };
    },

    async list(): Promise<CreditCard[]> {
      return db
        .select()
        .from(creditCardTable)
        .where(eq(creditCardTable.userId, authenticatedUserId))
        .orderBy(asc(creditCardTable.name));
    },

    async create(input: CreateCreditCardInput): Promise<CreditCard> {
      assertUserScope(authenticatedUserId, input.userId);

      const [card] = await db
        .insert(creditCardTable)
        .values({
          userId: authenticatedUserId,
          name: input.name,
          lastFour: input.lastFour,
          limitInCents: input.limitInCents,
          closingDay: input.closingDay,
          dueDay: input.dueDay,
        })
        .returning();

      if (!card) {
        throw new Error("Não foi possível criar o cartão.");
      }

      return card;
    },
  };
}
