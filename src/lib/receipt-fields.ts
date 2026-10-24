import { z } from "zod";
const fields = z.object({
  vendor: z.string().max(200).default(""),
  amount: z.coerce.number().finite().min(0).max(9999999999.99).default(0),
  description: z.string().max(200).default(""),
});
/** Model output is untrusted. It must pass the same scalar boundaries as manual input. */
export function parseReceiptFields(value: unknown) {
  return fields.parse(value);
}
