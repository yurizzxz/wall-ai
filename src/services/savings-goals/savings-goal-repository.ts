import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  savingsContributionTable,
  savingsGoalTable,
} from "@/db/schema";
import type { AmountInCents } from "@/modules/shared/domain/money";
import type {
  SavingsGoal,
  SavingsGoalStatus,
} from "@/modules/savings-goals/domain/savings-goal";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type CreateSavingsGoalInput = {
  userId: string;
  name: string;
  targetInCents: AmountInCents;
  deadline?: Date;
};

export type RecordSavingsContributionInput = {
  userId: string;
  savingsGoalId: string;
  accountId: string;
  transactionId?: string;
  amountInCents: AmountInCents;
  contributedAt: Date;
  nextSavedInCents: AmountInCents;
  nextStatus: SavingsGoalStatus;
};

function toSavingsGoal(
  row: typeof savingsGoalTable.$inferSelect,
): SavingsGoal {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    targetInCents: row.targetInCents,
    savedInCents: row.savedInCents,
    deadline: row.deadline ?? undefined,
    status: row.status,
  };
}

export function createSavingsGoalRepository(authenticatedUserId: string) {
  return {
    async findById(
      userId: string,
      savingsGoalId: string,
    ): Promise<SavingsGoal | null> {
      assertUserScope(authenticatedUserId, userId);

      const [goal] = await db
        .select()
        .from(savingsGoalTable)
        .where(
          and(
            eq(savingsGoalTable.id, savingsGoalId),
            eq(savingsGoalTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return goal ? toSavingsGoal(goal) : null;
    },

    async findByName(name: string): Promise<SavingsGoal | null> {
      const [goal] = await db
        .select()
        .from(savingsGoalTable)
        .where(
          and(
            eq(savingsGoalTable.userId, authenticatedUserId),
            eq(savingsGoalTable.name, name),
          ),
        )
        .limit(1);

      return goal ? toSavingsGoal(goal) : null;
    },

    async list(): Promise<SavingsGoal[]> {
      const goals = await db
        .select()
        .from(savingsGoalTable)
        .where(eq(savingsGoalTable.userId, authenticatedUserId))
        .orderBy(asc(savingsGoalTable.name));

      return goals.map(toSavingsGoal);
    },

    async create(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
      assertUserScope(authenticatedUserId, input.userId);

      const [goal] = await db
        .insert(savingsGoalTable)
        .values({
          userId: authenticatedUserId,
          name: input.name,
          targetInCents: input.targetInCents,
          deadline: input.deadline,
        })
        .returning();

      if (!goal) {
        throw new Error("Não foi possível criar o cofrinho.");
      }

      return toSavingsGoal(goal);
    },

    async recordContribution(
      input: RecordSavingsContributionInput,
    ): Promise<SavingsGoal> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (databaseTransaction) => {
        const [goal] = await databaseTransaction
          .update(savingsGoalTable)
          .set({
            savedInCents: input.nextSavedInCents,
            status: input.nextStatus,
          })
          .where(
            and(
              eq(savingsGoalTable.id, input.savingsGoalId),
              eq(savingsGoalTable.userId, authenticatedUserId),
            ),
          )
          .returning();

        if (!goal) {
          throw new Error("Cofrinho não encontrado.");
        }

        await databaseTransaction.insert(savingsContributionTable).values({
          userId: authenticatedUserId,
          savingsGoalId: input.savingsGoalId,
          accountId: input.accountId,
          transactionId: input.transactionId,
          amountInCents: input.amountInCents,
          contributedAt: input.contributedAt,
        });

        return toSavingsGoal(goal);
      });
    },

    async listContributions(savingsGoalId: string) {
      return db
        .select()
        .from(savingsContributionTable)
        .where(
          and(
            eq(savingsContributionTable.userId, authenticatedUserId),
            eq(savingsContributionTable.savingsGoalId, savingsGoalId),
          ),
        )
        .orderBy(desc(savingsContributionTable.contributedAt));
    },
  };
}
