import { toEnglishDigits } from "./digits";

export type NormalizeMode = "standard" | "search";

export interface NormalizeOptions {
  /**
   * - `standard` (default): safe for display and storage. Unifies look-alike
   *   characters and cleans up spacing without changing how the text reads.
   * - `search`: lossy folding for building search keys. Strips diacritics and
   *   invisible characters, folds letter variants, unifies digits and case.
   */
  mode?: NormalizeMode;
}

const ZWNJ = "\u200c";

/**
 * Letters that connect to the letter after them (Unicode joining type D), plus
 * tatweel. A ZWNJ only has an effect after one of these:
 * ئ ب ت ث ج ح خ س ش ص ض ط ظ ع غ ـ ف ق ك ل م ن ه ي ى پ چ ک گ ی
 */
const JOINS_FORWARD = new Set("\u0626\u0628\u062a\u062b\u062c\u062d\u062e\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063a\u0640\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u064a\u0649\u067e\u0686\u06a9\u06af\u06cc");

/**
 * Letters that connect to the letter before them: the ones above plus the
 * right-joining letters آ أ ؤ إ ا ة د ذ ر ز و ٱ ژ ۀ ە
 */
const JOINS_BACKWARD = new Set([...JOINS_FORWARD, ..."\u0622\u0623\u0624\u0625\u0627\u0629\u062f\u0630\u0631\u0632\u0648\u0671\u0698\u06c0\u06d5"]);

/** Combining marks are transparent to joining; skip them when looking for neighbours. */
const COMBINING_MARK = /\p{M}/u;

/**
 * Normalizes Persian text.
 *
 * `standard` mode (default):
 * - canonical composition (NFC) and Arabic presentation forms → regular letters
 *   (word ligatures such as ﷲ and the rial sign ﷼ are kept)
 * - Arabic ي/ى → Persian ی, Arabic ك → Persian ک
 * - Arabic-Indic digits ٠-٩ → Persian digits ۰-۹
 * - both encodings of ۀ (ه + hamza above, and U+06C0) → U+06C0
 * - ZWNJ kept only where it actually prevents two letters from joining;
 *   duplicates and stray ZWNJs (next to spaces, at word edges, after letters
 *   that never join forward) are removed
 * - runs of spaces/tabs collapsed to one space, lines trimmed, line breaks kept
 *
 * `search` mode additionally strips all diacritics, tatweel and invisible
 * formatting characters (ZWNJ included, so «می‌روم» and «میروم» match), folds
 * ۀ/ة → ه, أ/إ/آ/ٱ → ا, ؤ → و, ئ → ی, converts all digits to Latin, lowercases
 * Latin letters and collapses all whitespace, line breaks included.
 */
export function normalizePersian(text: string, options: NormalizeOptions = {}): string {
  return options.mode === "search" ? normalizeForSearch(text) : normalizeStandard(text);
}

function normalizeStandard(text: string): string {
  const unified = text
    .normalize("NFC")
    .replace(/\ufeff/g, "") // byte order mark
    .replace(/[\ufb50-\ufdef\ufe70-\ufefc]/g, (form) => form.normalize("NFKC")) // presentation forms
    .replace(/[\u064a\u0649]/g, "\u06cc") // ي ى → ی
    .replace(/\u0643/g, "\u06a9") // ك → ک
    .replace(/[\u0660-\u0669]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0x0660 + 0x06f0))
    .replace(/\u0647\u0654/g, "\u06c0"); // ه + hamza above → ۀ

  return cleanZwnj(unified)
    .replace(/\r\n?|[\u2028\u2029]/g, "\n") // CR, CRLF, line and paragraph separators
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

function normalizeForSearch(text: string): string {
  const folded = text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    // soft hyphen, tatweel, ALM, zero-width and bidi control characters, BOM
    .replace(/[\u00ad\u0640\u061c\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, "")
    .replace(/[\u064a\u0649]/g, "\u06cc") // ي ى (and ئ after decomposition) → ی
    .replace(/\u0643/g, "\u06a9") // ك → ک
    .replace(/[\u0629\u06d5]/g, "\u0647") // ة ە (and ۀ after decomposition) → ه
    .replace(/\u0671/g, "\u0627"); // ٱ → ا

  return toEnglishDigits(folded).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Keeps a single ZWNJ only between a forward-joining letter and a backward-joining one. */
function cleanZwnj(text: string): string {
  let result = "";
  let index = 0;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char !== ZWNJ) {
      result += char;
      index += 1;
      continue;
    }

    let runEnd = index;
    while (text.charAt(runEnd) === ZWNJ) runEnd += 1;

    const before = neighbour(text, index - 1, -1);
    const after = neighbour(text, runEnd, 1);
    if (JOINS_FORWARD.has(before) && JOINS_BACKWARD.has(after)) result += ZWNJ;
    index = runEnd;
  }
  return result;
}

/** The nearest non-combining-mark character from `start` in `step` direction ("" at the edges). */
function neighbour(text: string, start: number, step: 1 | -1): string {
  let position = start;
  while (position >= 0 && position < text.length && COMBINING_MARK.test(text.charAt(position))) {
    position += step;
  }
  return text.charAt(position);
}
