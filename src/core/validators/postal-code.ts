import type { ValidationResult } from "../types";
import { compactDigits, invalid, isRepeatedDigit } from "./shared";

export type PostalCodeInvalidReason =
  | "empty"
  | "invalidCharacters"
  | "length"
  | "repeatedDigits"
  | "pattern";

export type PostalCodeResult = ValidationResult<
  {
    /** The 10-digit code in Latin digits, no dash. */
    value: string;
  },
  PostalCodeInvalidReason
>;

export interface PostalCodeOptions {
  /**
   * Also reject codes with a 0 or 2 among the first five digits. This rule is
   * widely repeated but has no official source (Iran Post's UPU filing only
   * specifies 10 digits); every real code we could find follows it. Default `false`.
   */
  strict?: boolean;
}

/**
 * Validates an Iranian 10-digit postal code (کد پستی), accepting any digit
 * script and the usual «۱۲۳۴۵-۶۷۸۹۱» dash.
 */
export function validatePostalCode(
  code: string,
  options: PostalCodeOptions = {},
): PostalCodeResult {
  const value = compactDigits(code);
  if (value === "") return invalid("empty");
  if (!/^\d+$/.test(value)) return invalid("invalidCharacters");
  if (value.length !== 10) return invalid("length");
  if (isRepeatedDigit(value)) return invalid("repeatedDigits");
  if (options.strict && /[02]/.test(value.slice(0, 5))) return invalid("pattern");
  return { valid: true, value };
}
