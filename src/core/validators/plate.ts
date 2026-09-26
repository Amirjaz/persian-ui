import { toEnglishDigits } from "../digits";
import { normalizePersian } from "../normalize";
import type { ValidationResult } from "../types";
import { invalid } from "./shared";

/**
 * Letters issued on standard plates: the 13 private-car letters, then the
 * special-purpose ones (الف government, پ police, ت taxi, ث IRGC, ز Ministry of
 * Defence, ژ disabled drivers, ش army, ع public transport, ف General Staff,
 * ک agriculture, گ temporary transit).
 */
export const PLATE_LETTERS = [
  "ب", "ج", "د", "س", "ص", "ط", "ق", "ل", "م", "ن", "و", "ه", "ی",
  "الف", "پ", "ت", "ث", "ز", "ژ", "ش", "ع", "ف", "ک", "گ",
] as const;

export type PlateLetter = (typeof PLATE_LETTERS)[number];

export type PlateInvalidReason = "empty" | "format" | "letter" | "region" | "zeroDigit";

export interface PlateParts {
  /** The two digits on the left, e.g. "12". */
  twoDigit: string;
  letter: PlateLetter;
  /** The three digits after the letter, e.g. "345". */
  threeDigit: string;
  /** The two-digit code in the «ایران» box, from 10 to 99. */
  region: string;
}

export type PlateResult = ValidationResult<
  {
    /** Canonical form in Latin digits: "12ب345-67". */
    value: string;
    parts: PlateParts;
  },
  PlateInvalidReason
>;

export interface PlateOptions {
  /**
   * Also reject the digit 0 in the two- and three-digit groups, which
   * (according to Wikipedia, not an official source) is never issued there.
   * Default `false`.
   */
  strict?: boolean;
}

const MAIN_PART = /^(\d{2})(\D+)(\d{3})$/;
const REGION_MARKER = "#";

/**
 * Validates an Iranian car licence plate: two digits, a letter, three digits
 * and the two-digit region code.
 *
 * Accepts any digit script and common spellings: «۱۲ ب ۳۴۵ - ۶۷»,
 * «۱۲ب۳۴۵ ایران ۶۷», `12ب34567`, «ایران ۶۷ ۱۲ب۳۴۵», and «ا» for «الف».
 */
export function validatePlate(plate: string, options: PlateOptions = {}): PlateResult {
  const compact = toEnglishDigits(normalizePersian(plate ?? ""))
    .replace(/ایران/g, REGION_MARKER)
    .replace(/[\s\u200c\u200e\u200f\-\u2010-\u2015|_.،,]/g, "");
  if (compact === "") return invalid("empty");

  const split = splitRegion(compact);
  if (!split) return invalid("format");
  const main = MAIN_PART.exec(split.main);
  if (!main) return invalid("format");

  const twoDigit = main[1]!;
  const threeDigit = main[3]!;
  const letter = main[2] === "ا" ? "الف" : main[2]!;
  if (!isPlateLetter(letter)) return invalid("letter");
  if (split.region.startsWith("0")) return invalid("region");
  if (options.strict && /0/.test(twoDigit + threeDigit)) return invalid("zeroDigit");

  return {
    valid: true,
    value: `${twoDigit}${letter}${threeDigit}-${split.region}`,
    parts: { twoDigit, letter, threeDigit, region: split.region },
  };
}

/** Separates the region code from the rest, using «ایران» as a marker when present. */
function splitRegion(compact: string): { main: string; region: string } | null {
  const pieces = compact.split(REGION_MARKER);
  if (pieces.length > 2) return null;

  if (pieces.length === 1) {
    // No marker: the region code is the last two digits, as in "12ب34567".
    const match = /^(.*\D\d{3})(\d{2})$/.exec(compact);
    return match ? { main: match[1]!, region: match[2]! } : null;
  }

  const before = pieces[0]!;
  const after = pieces[1]!;
  if (/^\d{2}$/.test(after)) return { main: before, region: after }; // 12ب345 ایران 67
  if (/^\d{2}$/.test(before)) return { main: after, region: before }; // 67 ایران 12ب345
  if (before === "" && /^\d{2}\d{2}\D/.test(after)) {
    return { main: after.slice(2), region: after.slice(0, 2) }; // ایران 67 12ب345
  }
  return null;
}

function isPlateLetter(letter: string): letter is PlateLetter {
  return (PLATE_LETTERS as readonly string[]).includes(letter);
}
