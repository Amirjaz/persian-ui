const LATIN_ZERO = 0x30;
const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

/** Values accepted by the digit converters. Numbers are stringified with `String()`. */
export type DigitInput = string | number | bigint;

/**
 * Converts Latin (0-9) and Arabic-Indic (٠-٩) digits to Persian digits (۰-۹).
 * Every other character, including separators and signs, is left as is.
 *
 * @example toPersianDigits("1404/01/15") // "۱۴۰۴/۰۱/۱۵"
 */
export function toPersianDigits(input: DigitInput): string {
  return String(input).replace(/[0-9٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code < ARABIC_INDIC_ZERO ? code - LATIN_ZERO : code - ARABIC_INDIC_ZERO;
    return String.fromCharCode(PERSIAN_ZERO + value);
  });
}

/**
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin digits (0-9).
 * Every other character is left as is.
 *
 * @example toEnglishDigits("۰۹۱۲ ٣٤٥ 6789") // "0912 345 6789"
 */
export function toEnglishDigits(input: DigitInput): string {
  return String(input).replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code < PERSIAN_ZERO ? code - ARABIC_INDIC_ZERO : code - PERSIAN_ZERO;
    return String.fromCharCode(LATIN_ZERO + value);
  });
}
