import { BusinessError } from "@/modules/shared/application/business-error";
import { mutationRateLimit } from "@/services/security/rate-limit";

export async function enforceRateLimit(userId: string): Promise<void> {
  const result = await mutationRateLimit.limit(userId);

  if (!result.success) {
    throw new BusinessError(
      "RATE_LIMIT",
      "Muitas operações. Aguarde alguns segundos.",
    );
  }
}
