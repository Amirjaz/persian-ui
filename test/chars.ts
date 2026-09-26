/**
 * Characters used by the tests, built from code points so invisible and
 * look-alike characters can never be mistyped or silently lost in the source.
 */
const char = (codePoint: number): string => String.fromCharCode(codePoint);

// Invisible and formatting characters
export const ZWNJ = char(0x200c);
export const ZWJ = char(0x200d);
export const ZWSP = char(0x200b);
export const LRM = char(0x200e);
export const RLM = char(0x200f);
export const ALM = char(0x061c);
export const RLE = char(0x202b);
export const PDF = char(0x202c);
export const LRI = char(0x2066);
export const PDI = char(0x2069);
export const BOM = char(0xfeff);
export const NBSP = char(0x00a0);
export const SOFT_HYPHEN = char(0x00ad);
export const LINE_SEPARATOR = char(0x2028);
export const PARAGRAPH_SEPARATOR = char(0x2029);

// Punctuation
export const EN_DASH = char(0x2013);
export const MINUS_SIGN = char(0x2212);
export const ARABIC_THOUSANDS_SEPARATOR = char(0x066c);
export const ARABIC_DECIMAL_SEPARATOR = char(0x066b);

// Letters and marks
export const ARABIC_YEH = char(0x064a);
export const ALEF_MAKSURA = char(0x0649);
export const ARABIC_KAF = char(0x0643);
export const PERSIAN_YEH = char(0x06cc);
export const PERSIAN_KAF = char(0x06a9);
export const HEH = char(0x0647);
export const HAMZA_ABOVE = char(0x0654);
export const HEH_WITH_YEH_ABOVE = char(0x06c0);
export const AE = char(0x06d5);
export const TEH_MARBUTA = char(0x0629);
export const ALEF = char(0x0627);
export const ALEF_MADDA = char(0x0622);
export const ALEF_HAMZA_ABOVE = char(0x0623);
export const ALEF_HAMZA_BELOW = char(0x0625);
export const ALEF_WASLA = char(0x0671);
export const WAW = char(0x0648);
export const WAW_HAMZA = char(0x0624);
export const YEH_HAMZA = char(0x0626);
export const KASRA = char(0x0650);
export const TATWEEL = char(0x0640);

/** Latin digits → Persian digits (۰-۹), independent of the code under test. */
export function fa(text: string): string {
  return text.replace(/[0-9]/g, (digit) => char(0x06f0 + Number(digit)));
}

/** Latin digits → Arabic-Indic digits (٠-٩). */
export function arabicIndic(text: string): string {
  return text.replace(/[0-9]/g, (digit) => char(0x0660 + Number(digit)));
}

/** "1,234.5" written the Persian way: Persian digits, ٬ for groups, ٫ for decimals. */
export function faNumber(text: string): string {
  return fa(text).replace(/,/g, ARABIC_THOUSANDS_SEPARATOR).replace(/\./g, ARABIC_DECIMAL_SEPARATOR);
}
