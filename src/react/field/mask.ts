import { toEnglishDigits, toPersianDigits, type Digits } from "@amirjaz/persian-ui/core";

/**
 * Describes a masked input. The *value* is the string of significant
 * characters (Latin digits, plus "." for amounts); the *display* adds
 * separators and converts digits to the chosen script.
 */
export interface InputMask {
  /**
   * Maps typed characters one-to-one before they are tested, e.g. ٫ → ".".
   * Digits have already been converted to Latin.
   */
  normalize?: (text: string) => string;
  /** Whether a (normalized) character is significant. */
  accept: (char: string) => boolean;
  /** Cleans up the significant characters: converts prefixes, caps the length. */
  sanitize: (value: string) => string;
  /** Inserts separators for display. Works with Latin digits. */
  format: (value: string, digits: Digits) => string;
}

const isDigit = (char: string) => char >= "0" && char <= "9";

function normalizeText(text: string, mask: InputMask): string {
  const latin = toEnglishDigits(text);
  return mask.normalize ? mask.normalize(latin) : latin;
}

/** The significant characters of `text`, and how many of them come before `caret`. */
export function extractSignificant(
  text: string,
  caret: number,
  mask: InputMask,
): { value: string; beforeCaret: number } {
  const normalized = normalizeText(text, mask);
  let value = "";
  let beforeCaret = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized.charAt(index);
    if (!mask.accept(char)) continue;
    value += char;
    if (index < caret) beforeCaret += 1;
  }
  return { value, beforeCaret };
}

export function toDisplay(value: string, mask: InputMask, digits: Digits): string {
  const formatted = mask.format(value, digits);
  return digits === "fa" ? toPersianDigits(formatted) : formatted;
}

/** The position in `display` just after its `count`-th significant character. */
export function caretAfter(display: string, count: number, mask: InputMask): number {
  if (count <= 0) return 0;
  const normalized = normalizeText(display, mask);
  let seen = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    if (mask.accept(normalized.charAt(index))) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return display.length;
}

/** Splits digits into groups, e.g. [3, 6, 1] with "-" → "001-234567-8". No trailing separator. */
export function groupDigits(value: string, groups: readonly number[], separator: string): string {
  const parts: string[] = [];
  let index = 0;
  for (const size of groups) {
    if (index >= value.length) break;
    parts.push(value.slice(index, index + size));
    index += size;
  }
  return parts.join(separator);
}

/** A mask for a fixed number of digits shown in groups. */
export function digitGroupsMask(groups: readonly number[], separator: string): InputMask {
  const length = groups.reduce((sum, size) => sum + size, 0);
  return {
    accept: isDigit,
    sanitize: (value) => value.slice(0, length),
    format: (value) => groupDigits(value, groups, separator),
  };
}

export { isDigit };
