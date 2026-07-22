import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  savingsContributionTable,
  savingsGoalTable,
  transactionTable,
} from "@/db/schema";
import type { CreateSavingsGoalInput } from "@/modules/savings-goals/application/create-savings-goal";
import type { RecordSavingsContributionInput } from "@/modules/savings-goals/application/contribute-to-savings-goal";
import type {
  ListSavingsGoalsInput,
  SavingsGoalListItem,
} from "@/modules/savings-goals/application/list-savings-goals";
import {
  calculateSavingsProgress,
  type SavingsGoal,
} from "@/modules/savings-goals/domain/savings-goal";
import { assertUserScope } from "@/services/shared/assert-user-scope";

function toSavingsGoal(row: typeof savingsGoalTable.$inferSelect): SavingsGoal {
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
    async findById(userId: string, savingsGoalId: string): Promise<SavingsGoal | null> {
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

    async listForUser(
      input: ListSavingsGoalsInput,
    ): Promise<SavingsGoalListItem[]> {
      assertUserScope(authenticatedUserId, input.userId);

      const conditions = [eq(savingsGoalTable.userId, authenticatedUserId)];

      if (input.status) {
        conditions.push(eq(savingsGoalTable.status, input.status));
      }

      const goals = await db
        .select()
        .from(savingsGoalTable)
        .where(and(...conditions))
        .orderBy(asc(savingsGoalTable.name));

      return goals.map((goal) => {
        const savingsGoal = toSavingsGoal(goal);

        return {
          ...savingsGoal,
          progressPercentage: calculateSavingsProgress(savingsGoal),
        };
      });
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

    async recordContribution(input: RecordSavingsContributionInput): Promise<SavingsGoal> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (tx) => {
        const [goal] = await tx
          .update(savingsGoalTable)
          .set({ savedInCents: input.nextSavedInCents, status: input.nextStatus })
          .where(
            and(
              eq(savingsGoalTable.id, input.savingsGoalId),
              eq(savingsGoalTable.userId, authenticatedUserId),
              eq(savingsGoalTable.savedInCents, input.expectedSavedInCents),
            ),
          )
          .returning();

        if (!goal) {
          throw new Error("O cofrinho foi alterado por outra operação.");
        }

        const [transaction] = await tx
          .insert(transactionTable)
          .values({
            userId: authenticatedUserId,
            accountId: input.accountId,
            description: input.description,
            amountInCents: input.amountInCents,
            kind: "EXPENSE",
            status: "SETTLED",
            origin: "SAVINGS_CONTRIBUTION",
            paymentMethod: "BANK_TRANSFER",
            occurredAt: input.contributedAt,
            settledAt: input.contributedAt,
          })
          .returning({ id: transactionTable.id });

        if (!transaction) {
          throw new Error("Não foi possível registrar o aporte.");
        }

        await tx.insert(savingsContributionTable).values({
          userId: authenticatedUserId,
          savingsGoalId: input.savingsGoalId,
          accountId: input.accountId,
          transactionId: transaction.id,
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
