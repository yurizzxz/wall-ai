import { actionClient } from "@/lib/safe-action";
import { requireSession } from "@/services/users/require-session";

export const authenticatedAction = actionClient.use(
  async ({ next }) => {
    const session = await requireSession();

    return next({
      ctx: {
        user: session.user,
      },
    });
  },
);