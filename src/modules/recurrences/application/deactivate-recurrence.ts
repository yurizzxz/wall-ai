import { BusinessError } from "@/modules/shared/application/business-error";
import type { RecurringTransaction } from "@/modules/recurrences/domain/recurrence";

export type DeactivateRecurrenceInput = {
  userId: string;
  recurrenceId: string;
};

export type DeactivateRecurrenceDependencies = {
  findById(
    userId: string,
    recurrenceId: string,
  ): Promise<RecurringTransaction | null>;
  deactivate(recurrenceId: string): Promise<void>;
};

export async function deactivateRecurrence(
  input: DeactivateRecurrenceInput,
  repository: DeactivateRecurrenceDependencies,
): Promise<void> {
  const recurrence = await repository.findById(
    input.userId,
    input.recurrenceId,
  );

  if (!recurrence) {
    throw new BusinessError(
      "RECURRENCE_NOT_FOUND",
      "Recorrência não encontrada para esse usuário.",
    );
  }

  if (!recurrence.isActive) {
    throw new BusinessError(
      "RECURRENCE_ALREADY_INACTIVE",
      "A recorrência já está inativa.",
    );
  }

  await repository.deactivate(input.recurrenceId);
}
