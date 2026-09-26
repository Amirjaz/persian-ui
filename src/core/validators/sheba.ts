import type { ValidationResult } from "../types";
import { compactDigits, invalid } from "./shared";

export type ShebaInvalidReason = "empty" | "invalidCharacters" | "country" | "length" | "checksum";

export type ShebaResult = ValidationResult<
  {
    /** "IR" followed by 24 digits, no spaces. */
    value: string;
  },
  ShebaInvalidReason
>;

/** "IR" converted to digits for the mod-97 check: I = 18, R = 27. */
const IR_AS_DIGITS = "1827";

/**
 * Validates an Iranian IBAN (شماره شبا) with the ISO 13616 mod-97 check.
 *
 * Accepts `IR` + 24 digits or the 24 digits alone, in any digit script and
 * letter case, with spaces or dashes. Check digits 00, 01 and 99 are rejected
 * even though they can satisfy the mod-97 test (ISO 13616 only issues 02–98).
 */
export function validateSheba(iban: string): ShebaResult {
  const compact = compactDigits(iban).toUpperCase();
  if (compact === "") return invalid("empty");

  let digits: string;
  if (/^\d+$/.test(compact)) {
    digits = compact;
  } else if (/^[A-Z]{2}\d*$/.test(compact)) {
    if (!compact.startsWith("IR")) return invalid("country");
    digits = compact.slice(2);
  } else {
    return invalid("invalidCharacters");
  }

  if (digits.length !== 24) return invalid("length");
  const checkDigits = digits.slice(0, 2);
  if (checkDigits === "00" || checkDigits === "01" || checkDigits === "99") {
    return invalid("checksum");
  }
  // Move the country code and check digits to the end, then take the remainder mod 97.
  if (mod97(digits.slice(2) + IR_AS_DIGITS + checkDigits) !== 1) return invalid("checksum");

  return { valid: true, value: `IR${digits}` };
}

function mod97(numeric: string): number {
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder;
}
