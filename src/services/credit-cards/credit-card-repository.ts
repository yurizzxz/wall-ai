import { and, asc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  creditCardTable,
  invoiceTable,
  transactionTable,
} from "@/db/schema";
import type { CreateCreditCardInput } from "@/modules/credit-cards/application/create-credit-card";
import type {
  CreditCardListItem,
  ListCreditCardsRepository,
} from "@/modules/credit-cards/application/list-credit-cards";
import {
  calculateAvailableLimit,
  type CreditCard,
} from "@/modules/credit-cards/domain/credit-card";
import type { AmountInCents } from "@/modules/shared/domain/money";
import { assertUserScope } from "@/services/shared/assert-user-scope";

type CreditCardWithCommittedAmount = {
  card: CreditCard;
  committedInCents: AmountInCents;
};

export function createCreditCardRepository(
  authenticatedUserId: string,
): ListCreditCardsRepository & {
  findByName(userId: string, name: string): Promise<CreditCard | null>;
  findById(
    userId: string,
    creditCardId: string,
  ): Promise<CreditCardWithCommittedAmount | null>;
  list(): Promise<CreditCard[]>;
  create(input: CreateCreditCardInput): Promise<CreditCard>;
  setActive(
    userId: string,
    creditCardId: string,
    isActive: boolean,
  ): Promise<CreditCard>;
} {
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
    async findByName(userId: string, name: string): Promise<CreditCard | null> {
      assertUserScope(authenticatedUserId, userId);

      const [card] = await db
        .select()
        .from(creditCardTable)
        .where(
          and(
            eq(creditCardTable.userId, authenticatedUserId),
            eq(creditCardTable.name, name),
          ),
        )
        .limit(1);

      return card ?? null;
    },

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

    async listWithUsage(userId): Promise<CreditCardListItem[]> {
      assertUserScope(authenticatedUserId, userId);

      const [cards, invoiceTotals, unbilledTotals] = await Promise.all([
        db
          .select()
          .from(creditCardTable)
          .where(eq(creditCardTable.userId, authenticatedUserId))
          .orderBy(asc(creditCardTable.name)),
        db
          .select({
            creditCardId: invoiceTable.creditCardId,
            total: sql<number>`coalesce(sum(${invoiceTable.totalInCents} - ${invoiceTable.paidInCents}), 0)`,
          })
          .from(invoiceTable)
          .where(
            and(
              eq(invoiceTable.userId, authenticatedUserId),
              ne(invoiceTable.status, "PAID"),
            ),
          )
          .groupBy(invoiceTable.creditCardId),
        db
          .select({
            creditCardId: transactionTable.creditCardId,
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
              isNotNull(transactionTable.creditCardId),
              ne(transactionTable.status, "CANCELLED"),
              isNull(creditCardInstallmentTable.invoiceId),
            ),
          )
          .groupBy(transactionTable.creditCardId),
      ]);
      const invoiceByCard = new Map(
        invoiceTotals.map((item) => [item.creditCardId, Number(item.total)]),
      );
      const unbilledByCard = new Map(
        unbilledTotals.map((item) => [item.creditCardId, Number(item.total)]),
      );

      return cards.map((card) => {
        const committedInCents =
          (invoiceByCard.get(card.id) ?? 0) +
          (unbilledByCard.get(card.id) ?? 0);

        return {
          ...card,
          lastFour: card.lastFour ?? undefined,
          committedInCents,
          availableInCents: calculateAvailableLimit(
            card.limitInCents,
            committedInCents,
          ),
        };
      });
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

    async setActive(
      userId: string,
      creditCardId: string,
      isActive: boolean,
    ): Promise<CreditCard> {
      assertUserScope(authenticatedUserId, userId);

      const [card] = await db
        .update(creditCardTable)
        .set({ isActive })
        .where(
          and(
            eq(creditCardTable.id, creditCardId),
            eq(creditCardTable.userId, authenticatedUserId),
          ),
        )
        .returning();

      if (!card) {
        throw new Error("Cartão não encontrado.");
      }

      return card;
    },
  };
}
