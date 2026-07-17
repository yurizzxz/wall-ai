export function assertUserScope(
  authenticatedUserId: string,
  requestedUserId: string,
): void {
  if (authenticatedUserId !== requestedUserId) {
    throw new Error("Acesso negado aos dados solicitados.");
  }
}
