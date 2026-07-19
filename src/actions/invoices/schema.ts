import { z } from "zod";

import {
  accountPaymentMethodSchema,
  entityIdSchema,
  positiveAmountInCentsSchema,
} from "@/actions/shared/schema";

export const closeInvoiceSchema = z.object({
  invoiceId: entityIdSchema,
});

export const payInvoiceSchema = z.object({
  invoiceId: entityIdSchema,
  accountId: entityIdSchema,
  categoryId: entityIdSchema,
  amountInCents: positiveAmountInCentsSchema,
  paymentMethod: accountPaymentMethodSchema,
});

export type PayInvoiceActionInput = z.infer<typeof payInvoiceSchema>;
