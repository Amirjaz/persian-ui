import { toEnglishDigits } from "../digits";

/**
 * Characters people use to group digits, plus invisible marks that ride along
 * with pasted text: whitespace, ZWNJ, bidi marks and dashes.
 */
const GROUPING = /[\s\u200c\u200e\u200f\u061c\-\u2010-\u2015\u2212]/g;

/**
 * Converts any digit script to Latin and drops grouping characters.
 * `null`/`undefined` from untyped callers become an empty string.
 */
export function compactDigits(input: string, extraGrouping?: RegExp): string {
  const compact = toEnglishDigits(input ?? "").replace(GROUPING, "");
  return extraGrouping ? compact.replace(extraGrouping, "") : compact;
}

export function invalid<TReason extends string>(reason: TReason): { valid: false; reason: TReason } {
  return { valid: false, reason };
}

/** `true` for strings like "1111111111": they pass several checksums but are never real. */
export function isRepeatedDigit(digits: string): boolean {
  return /^(\d)\1*$/.test(digits);
}
