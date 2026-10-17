import { z } from "zod";

/**
 * All money in Kosh is integer paise (1 rupee = 100 paise).
 * Never floats — floating point has no place near currency.
 */
export const paiseSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

/** Convert rupees (e.g. 1299.50) to paise (129950). Rounds to nearest paise. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise to rupees. */
export function toRupees(paise: number): number {
  return paise / 100;
}

/** Format paise as an INR string, e.g. 129950 -> "₹1,299.50". */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(toRupees(paise));
}
