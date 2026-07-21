import { BusinessError } from "@/modules/shared/application/business-error";
import { BUSINESS_ERROR_MESSAGES } from "@/actions/shared/business-error-messages";

type ActionErrorResponse = {
  ok: false;
  error: string;
  message: string;
};

type ActionSuccessResponse = {
  ok: true;
  id: string;
  error?: never;
  message?: never;
};

type HandleActionErrorOptions = {
  context: string;
  fallbackMessage: string;
};

export function actionSuccess(id: string): ActionSuccessResponse {
  return { ok: true, id };
}

export function handleActionError(
  error: unknown,
  options: HandleActionErrorOptions,
): ActionErrorResponse {
  if (error instanceof BusinessError) {
    return {
      ok: false,
      error: error.code,
      message: BUSINESS_ERROR_MESSAGES[error.code],
    };
  }

  console.error(options.context, error);

  return {
    ok: false,
    error: "OPERATION_FAILED",
    message: options.fallbackMessage,
  };
}
