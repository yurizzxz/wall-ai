import { tool } from "ai";
import { z } from "zod";

import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { listCreditCards } from "@/modules/credit-cards/application/list-credit-cards";
import {
  getDashboardCharts,
  getDashboardCommitments,
  getDashboardIndicators,
} from "@/modules/dashboard/application/get-dashboard-summary";
import { listDebts } from "@/modules/debts/application/list-debts";
import { listInvoices } from "@/modules/invoices/application/list-invoices";
import { listRecurrences } from "@/modules/recurrences/application/list-recurrences";
import { listSavingsGoals } from "@/modules/savings-goals/application/list-savings-goals";
import { listTransactions } from "@/modules/transactions/application/list-transactions";
import { createRepositories } from "@/services/repositories";

const transactionKindSchema = z.enum(["INCOME", "EXPENSE"]);
const transactionStatusSchema = z.enum(["PENDING", "SETTLED", "CANCELLED"]);
const invoiceStatusSchema = z.enum(["OPEN", "CLOSED", "OVERDUE", "PAID"]);
const savingsGoalStatusSchema = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);
const debtStatusSchema = z.enum(["OPEN", "OVERDUE", "PAID", "CANCELLED"]);

function toIsoString(value: Date | undefined) {
  return value?.toISOString();
}

function getMonthPeriod(year: number, month: number) {
  const periodStart = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`,
  );
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const periodEnd = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00-03:00`,
  );

  return { periodStart, periodEnd };
}

export function createAssistantTools(userId: string) {
  const repositories = createRepositories(userId);

  return {
    getAccountBalances: tool({
      description:
        "Consulta as contas do usuário e seus saldos atuais. Todos os valores monetários retornados estão em centavos.",
      inputSchema: z.object({}),
      execute: async () => {
        const accounts = await listAccounts(userId, repositories.accounts);

        return accounts.map((account) => ({
          name: account.name,
          type: account.type,
          currency: account.currency,
          balanceInCents: account.balanceInCents,
          isActive: account.isActive,
        }));
      },
    }),

    listRecentTransactions: tool({
      description:
        "Lista os lançamentos financeiros mais recentes do usuário. Use filtros somente quando a pergunta exigir. Valores estão em centavos.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
        kind: transactionKindSchema.optional(),
        status: transactionStatusSchema.optional(),
      }),
      execute: async ({ limit, kind, status }) => {
        const page = await listTransactions(
          {
            userId,
            page: 1,
            pageSize: limit ?? 10,
            kind,
            status,
          },
          repositories.transactions,
        );

        return {
          total: page.total,
          transactions: page.items.map((transaction) => ({
            description: transaction.description,
            amountInCents: transaction.amountInCents,
            kind: transaction.kind,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            occurredAt: transaction.occurredAt.toISOString(),
            dueAt: toIsoString(transaction.dueAt),
            category: transaction.categoryName,
            account: transaction.accountName,
            creditCard: transaction.creditCardName,
            installmentCount: transaction.installmentCount,
          })),
        };
      },
    }),

    getCreditCards: tool({
      description:
        "Consulta cartões, limites, valor comprometido e limite disponível. Todos os valores estão em centavos.",
      inputSchema: z.object({}),
      execute: async () => {
        const cards = await listCreditCards(userId, repositories.creditCards);

        return cards.map((card) => ({
          name: card.name,
          lastFour: card.lastFour,
          limitInCents: card.limitInCents,
          committedInCents: card.committedInCents,
          availableInCents: card.availableInCents,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          isActive: card.isActive,
        }));
      },
    }),

    getInvoices: tool({
      description:
        "Consulta faturas dos cartões e seus valores pagos e pendentes. Todos os valores estão em centavos.",
      inputSchema: z.object({
        status: invoiceStatusSchema.optional(),
      }),
      execute: async ({ status }) => {
        const invoices = await listInvoices(
          { userId, status },
          repositories.invoices,
        );
        const recentInvoices = invoices.slice(-12);

        return {
          total: invoices.length,
          invoices: recentInvoices.map((invoice) => ({
            creditCard: invoice.creditCardName,
            status: invoice.status,
            totalInCents: invoice.totalInCents,
            paidInCents: invoice.paidInCents,
            outstandingInCents: invoice.outstandingInCents,
            periodStart: invoice.periodStart.toISOString(),
            periodEnd: invoice.periodEnd.toISOString(),
            dueAt: invoice.dueAt.toISOString(),
            paidAt: toIsoString(invoice.paidAt),
          })),
        };
      },
    }),

    getSavingsGoals: tool({
      description:
        "Consulta metas de economia, valor guardado, objetivo e progresso. Valores estão em centavos.",
      inputSchema: z.object({
        status: savingsGoalStatusSchema.optional(),
      }),
      execute: async ({ status }) => {
        const goals = await listSavingsGoals(
          { userId, status },
          repositories.savingsGoals,
        );

        return {
          total: goals.length,
          goals: goals.slice(0, 20).map((goal) => ({
            name: goal.name,
            status: goal.status,
            targetInCents: goal.targetInCents,
            savedInCents: goal.savedInCents,
            progressPercentage: goal.progressPercentage,
            deadline: toIsoString(goal.deadline),
          })),
        };
      },
    }),

    getDebts: tool({
      description:
        "Consulta dívidas do usuário, incluindo total, valor pago, saldo pendente e vencimento. Valores estão em centavos.",
      inputSchema: z.object({
        status: debtStatusSchema.optional(),
      }),
      execute: async ({ status }) => {
        const debts = await listDebts({ userId, status }, repositories.debts);

        return {
          total: debts.length,
          debts: debts.slice(0, 20).map((debt) => ({
            creditor: debt.creditor,
            description: debt.description,
            status: debt.status,
            totalInCents: debt.totalInCents,
            paidInCents: debt.paidInCents,
            outstandingInCents: debt.outstandingInCents,
            dueAt: toIsoString(debt.dueAt),
          })),
        };
      },
    }),

    getRecurrences: tool({
      description:
        "Consulta cobranças e lançamentos recorrentes, como assinaturas, incluindo a próxima ocorrência. Valores estão em centavos.",
      inputSchema: z.object({
        isActive: z.boolean().optional(),
      }),
      execute: async ({ isActive }) => {
        const recurrences = await listRecurrences(
          { userId, isActive },
          repositories.recurrences,
        );

        return {
          total: recurrences.length,
          recurrences: recurrences.slice(0, 20).map((recurrence) => ({
            description: recurrence.description,
            amountInCents: recurrence.amountInCents,
            kind: recurrence.kind,
            paymentMethod: recurrence.paymentMethod,
            frequency: recurrence.frequency,
            nextOccurrenceAt: recurrence.nextOccurrenceAt.toISOString(),
            endsAt: toIsoString(recurrence.endsAt),
            isActive: recurrence.isActive,
            category: recurrence.categoryName,
            account: recurrence.accountName,
            creditCard: recurrence.creditCardName,
          })),
        };
      },
    }),

    getMonthlySummary: tool({
      description:
        "Consulta o resumo financeiro e as despesas por categoria de um mês específico. Todos os valores estão em centavos.",
      inputSchema: z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
      }),
      execute: async ({ year, month }) => {
        const { periodStart, periodEnd } = getMonthPeriod(year, month);
        const [indicators, charts, commitments] = await Promise.all([
          getDashboardIndicators(
            { userId, periodStart, periodEnd },
            repositories.dashboard,
          ),
          getDashboardCharts(
            {
              userId,
              periodStart,
              periodEnd,
              trendStart: periodStart,
            },
            repositories.dashboard,
          ),
          getDashboardCommitments(userId, repositories.dashboard),
        ]);

        return {
          year,
          month,
          ...indicators,
          ...commitments,
          expensesByCategory: charts.expensesByCategory,
        };
      },
    }),
  };
}
