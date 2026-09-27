import { parseAmount } from "./money";

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
/** Short scale, as used in Iran: میلیارد is 10⁹, تریلیون 10¹². */
const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];
const MAX_DIGITS = SCALES.length * 3;

/**
 * Writes a whole number in Persian words, joined with «و» as on cheques and
 * invoices.
 *
 * @example
 * numberToWords(1250000)   // "یک میلیون و دویست و پنجاه هزار"
 * numberToWords("۲۰۲۵")    // "دو هزار و بیست و پنج"
 * numberToWords(-7)        // "منفی هفت"
 *
 * Accepts numbers, bigints and numeric strings in any digit script, with
 * grouping separators. 1000 is written «یک هزار».
 *
 * @throws {RangeError} for fractions, for numbers beyond
 * `Number.MAX_SAFE_INTEGER` (pass a bigint or a string instead), for values of
 * 10¹⁸ or more, and for malformed strings.
 */
export function numberToWords(value: number | bigint | string): string {
  if (typeof value === "number" && Number.isInteger(value) && !Number.isSafeInteger(value)) {
    throw new RangeError(`${value} is beyond Number.MAX_SAFE_INTEGER; pass a bigint or a string`);
  }
  const { negative, integer, fraction } = parseAmount(value);
  if (/[1-9]/.test(fraction)) throw new RangeError(`Not a whole number: ${String(value)}`);
  if (integer.length > MAX_DIGITS) throw new RangeError(`Too large to write in words: ${String(value)}`);
  if (integer === "0") return "صفر";

  const parts: string[] = [];
  const groups = Math.ceil(integer.length / 3);
  const padded = integer.padStart(groups * 3, "0");
  for (let group = 0; group < groups; group += 1) {
    const hundreds = Number(padded.slice(group * 3, group * 3 + 3));
    if (hundreds === 0) continue;
    const scale = SCALES[groups - 1 - group];
    parts.push(scale ? `${belowThousand(hundreds)} ${scale}` : belowThousand(hundreds));
  }
  const words = parts.join(" و ");
  return negative ? `منفی ${words}` : words;
}

function belowThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]!);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]!);
  } else {
    if (rest >= 20) parts.push(TENS[Math.floor(rest / 10)]!);
    if (rest % 10 > 0) parts.push(ONES[rest % 10]!);
  }
  return parts.join(" و ");
}
