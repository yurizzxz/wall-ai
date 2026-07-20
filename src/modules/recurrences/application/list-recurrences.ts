import type { RecurringTransaction } from "../domain/recurrence";

export type RecurrenceListItem = RecurringTransaction & {
  accountId?: string;
  categoryId: string;
  creditCardId?: string;
  accountName?: string;
  categoryName: string;
  creditCardName?: string;
};

export type ListRecurrencesInput = {
  userId: string;
  isActive?: boolean;
};

export type ListRecurrencesRepository = {
  listForUser(input: ListRecurrencesInput): Promise<RecurrenceListItem[]>;
};

export async function listRecurrences(
  input: ListRecurrencesInput,
  repository: ListRecurrencesRepository,
): Promise<RecurrenceListItem[]> {
  if (!input.userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listForUser(input);
}
