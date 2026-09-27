import { getBankFromCardNumber, type IranianBank } from "../banks";
import type { ValidationResult } from "../types";
import { compactDigits, invalid, isRepeatedDigit } from "./shared";

export type CardNumberInvalidReason = "empty" | "invalidCharacters" | "length" | "repeatedDigits" | "checksum";

export type CardNumberResult = ValidationResult<
  {
    /** The 16 digits in Latin script, no spaces. */
    value: string;
    /** The issuing bank, or `null` for prefixes not in `IRANIAN_BANKS`. */
    bank: IranianBank | null;
  },
  CardNumberInvalidReason
>;

/**
 * Validates an Iranian bank card number (Shetab, 16 digits) with the Luhn
 * checksum, and detects the issuing bank.
 *
 * Accepts any digit script, with spaces or dashes (cards print it as four
 * groups of four). A number made of one repeated digit is rejected: «0000 0000
 * 0000 0000» passes the checksum but is never issued. Cards whose prefix isn't
 * in the table still validate, with `bank: null`.
 */
export function validateCardNumber(card: string): CardNumberResult {
  const value = compactDigits(card);
  if (value === "") return invalid("empty");
  if (!/^\d+$/.test(value)) return invalid("invalidCharacters");
  if (value.length !== 16) return invalid("length");
  if (isRepeatedDigit(value)) return invalid("repeatedDigits");
  if (!passesLuhn(value)) return invalid("checksum");
  return { valid: true, value, bank: getBankFromCardNumber(value) };
}

/** Luhn: double every second digit from the right, subtract 9 above 9, sum mod 10. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
