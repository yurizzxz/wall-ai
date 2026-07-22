import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { processDueRecurrences } from "@/services/recurrences/process-due-recurrences";

function isAuthorized(request: NextRequest, secret: string) {
  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;
  if (!authorization) return false;
  const receivedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await processDueRecurrences(new Date());
  if (result.processed > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/recurrences");
    revalidatePath("/dashboard/credit-cards");
    revalidatePath("/dashboard/invoices");
  }
  return NextResponse.json(result);
}
