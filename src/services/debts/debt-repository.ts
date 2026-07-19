import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { debtPaymentTable, debtTable, transactionTable } from "@/db/schema";
import type { CreateDebtInput } from "@/modules/debts/application/create-debt";
import type { RecordDebtPaymentInput } from "@/modules/debts/application/pay-debt";
import type { Debt } from "@/modules/debts/domain/debt";
import { assertUserScope } from "@/services/shared/assert-user-scope";

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

      return db.transaction(async (tx) => {
        const [debt] = await tx
          .update(debtTable)
          .set({
            paidInCents: input.nextPaidInCents,
            status: input.nextStatus,
          })
          .where(
            and(
              eq(debtTable.id, input.debtId),
              eq(debtTable.userId, authenticatedUserId),
              eq(debtTable.paidInCents, input.expectedPaidInCents),
            ),
          )
          .returning();

        if (!debt) {
          throw new Error("A dívida foi alterada por outra operação.");
        }

        const [transaction] = await tx
          .insert(transactionTable)
          .values({
            userId: authenticatedUserId,
            accountId: input.accountId,
            categoryId: input.categoryId,
            description: input.description,
            amountInCents: input.amountInCents,
            kind: "EXPENSE",
            status: "SETTLED",
            paymentMethod: input.paymentMethod,
            occurredAt: input.paidAt,
            settledAt: input.paidAt,
          })
          .returning({ id: transactionTable.id });

        if (!transaction) {
          throw new Error("Não foi possível registrar o pagamento da dívida.");
        }

        await tx.insert(debtPaymentTable).values({
          userId: authenticatedUserId,
          debtId: input.debtId,
          accountId: input.accountId,
          transactionId: transaction.id,
          amountInCents: input.amountInCents,
          paidAt: input.paidAt,
        });

        return toDebt(debt);
      });
    },
  };
}
