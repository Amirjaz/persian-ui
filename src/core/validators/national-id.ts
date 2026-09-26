import type { ValidationResult } from "../types";
import { compactDigits, invalid, isRepeatedDigit } from "./shared";

export type NationalIdInvalidReason =
  | "empty"
  | "invalidCharacters"
  | "length"
  | "repeatedDigits"
  | "zeroSerial"
  | "checksum";

export type NationalIdResult = ValidationResult<
  {
    /** The 10-digit code in Latin digits, leading zeros kept. */
    value: string;
  },
  NationalIdInvalidReason
>;

export interface NationalIdOptions {
  /**
   * Accept 8–9 digit input by restoring the leading zeros that spreadsheets and
   * integer columns drop (codes issued in Tehran start with "00"). Default `false`:
   * a form field should ask for all 10 digits as printed on the card.
   */
  padShort?: boolean;
}

/**
 * Validates an Iranian national ID (کد ملی).
 *
 * Accepts Persian, Arabic-Indic and Latin digits, with spaces or dashes (the
 * card prints it as xxx-xxxxxx-x). Rejects codes made of one repeated digit and codes whose
 * digits 4–9 are all zero (both pass the checksum but are never issued), then
 * verifies the check digit: digits 1–9 weighted 10…2, summed, mod 11; a
 * remainder below 2 is the check digit itself, otherwise 11 minus it.
 */
export function validateNationalId(
  code: string,
  options: NationalIdOptions = {},
): NationalIdResult {
  let value = compactDigits(code);
  if (value === "") return invalid("empty");
  if (!/^\d+$/.test(value)) return invalid("invalidCharacters");
  if (options.padShort && (value.length === 8 || value.length === 9)) {
    value = value.padStart(10, "0");
  }
  if (value.length !== 10) return invalid("length");
  if (isRepeatedDigit(value)) return invalid("repeatedDigits");
  if (value.slice(3, 9) === "000000") return invalid("zeroSerial");

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(value[i]) * (10 - i);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  if (checkDigit !== Number(value[9])) return invalid("checksum");

  return { valid: true, value };
}
