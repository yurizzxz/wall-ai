import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { debtPaymentTable, debtTable } from "@/db/schema";
import type { Debt, DebtStatus } from "@/modules/debts/domain/debt";
import type { AmountInCents } from "@/modules/shared/domain/money";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type CreateDebtInput = {
  userId: string;
  creditor: string;
  description: string;
  totalInCents: AmountInCents;
  dueAt?: Date;
};

export type RecordDebtPaymentInput = {
  userId: string;
  debtId: string;
  accountId: string;
  transactionId?: string;
  amountInCents: AmountInCents;
  paidAt: Date;
  nextPaidInCents: AmountInCents;
  nextStatus: DebtStatus;
};

function toDebt(row: typeof debtTable.$inferSelect): Debt {
  return {
    id: row.id,
    userId: row.userId,
    creditor: row.creditor,
    description: row.description,
    totalInCents: row.totalInCents,
    paidInCents: row.paidInCents,
    dueAt: row.dueAt ?? undefined,
    status: row.status,
  };
}

export function createDebtRepository(authenticatedUserId: string) {
  return {
    async findById(userId: string, debtId: string): Promise<Debt | null> {
      assertUserScope(authenticatedUserId, userId);

      const [debt] = await db
        .select()
        .from(debtTable)
        .where(
          and(
            eq(debtTable.id, debtId),
            eq(debtTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return debt ? toDebt(debt) : null;
    },

    async list(): Promise<Debt[]> {
      const debts = await db
        .select()
        .from(debtTable)
        .where(eq(debtTable.userId, authenticatedUserId))
        .orderBy(desc(debtTable.createdAt));

      return debts.map(toDebt);
    },

    async create(input: CreateDebtInput): Promise<Debt> {
      assertUserScope(authenticatedUserId, input.userId);

      const [debt] = await db
        .insert(debtTable)
        .values({
          userId: authenticatedUserId,
          creditor: input.creditor,
          description: input.description,
          totalInCents: input.totalInCents,
          dueAt: input.dueAt,
        })
        .returning();

      if (!debt) {
        throw new Error("Não foi possível criar a dívida.");
      }

      return toDebt(debt);
    },

    async recordPayment(input: RecordDebtPaymentInput): Promise<Debt> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (databaseTransaction) => {
        const [debt] = await databaseTransaction
          .update(debtTable)
          .set({
            paidInCents: input.nextPaidInCents,
            status: input.nextStatus,
          })
          .where(
            and(
              eq(debtTable.id, input.debtId),
              eq(debtTable.userId, authenticatedUserId),
            ),
          )
          .returning();

        if (!debt) {
          throw new Error("Dívida não encontrada.");
        }

        await databaseTransaction.insert(debtPaymentTable).values({
          userId: authenticatedUserId,
          debtId: input.debtId,
          accountId: input.accountId,
          transactionId: input.transactionId,
          amountInCents: input.amountInCents,
          paidAt: input.paidAt,
        });

        return toDebt(debt);
      });
    },
  };
}
