import { toEnglishDigits, toPersianDigits } from "./digits";
import type { Digits } from "./types";

/**
 * An amount of money: a number, a bigint (for amounts beyond
 * `Number.MAX_SAFE_INTEGER`), or a numeric string in any digit script, with
 * optional grouping separators and a `.`/`٫` decimal point.
 */
export type MoneyAmount = number | bigint | string;

export interface MoneyFormatOptions {
  /** Append the unit name («تومان» or «ریال»). Default `true`. */
  suffix?: boolean;
  /** Digit glyphs. Default `"fa"`. */
  digits?: Digits;
  /** Thousands separator. Default `"٬"` (U+066C) with Persian digits, `","` with Latin digits. */
  separator?: string;
}

// Persian number symbols as defined by CLDR (what Intl.NumberFormat("fa-IR") produces).
const PERSIAN_GROUP_SEPARATOR = "٬";
const PERSIAN_DECIMAL_SEPARATOR = "٫";
/** LRM + MINUS SIGN: the LRM keeps the sign on the left of the digits inside RTL text. */
const PERSIAN_MINUS = "\u200e\u2212";

/** Characters ignored when parsing string amounts: whitespace, grouping separators, bidi marks. */
const IGNORED_IN_AMOUNT = /[\s,'_،٬\u061c\u200e\u200f]/g;
const AMOUNT_PATTERN = /^([+\-\u2212])?(\d+)(?:[.٫](\d+))?$/;

/**
 * Formats an amount in toman.
 *
 * @example
 * formatToman(1250000)                    // "۱٬۲۵۰٬۰۰۰ تومان"
 * formatToman(1250000, { digits: "en" })  // "1,250,000 تومان"
 * formatToman("۱۲۵۰۰۰۰", { suffix: false }) // "۱٬۲۵۰٬۰۰۰"
 *
 * @throws {RangeError} for non-finite numbers and malformed strings.
 */
export function formatToman(amount: MoneyAmount, options?: MoneyFormatOptions): string {
  return formatMoney(amount, "تومان", options);
}

/**
 * Formats an amount in rial. Same options and behaviour as {@link formatToman}.
 *
 * @example formatRial(12500000) // "۱۲٬۵۰۰٬۰۰۰ ریال"
 */
export function formatRial(amount: MoneyAmount, options?: MoneyFormatOptions): string {
  return formatMoney(amount, "ریال", options);
}

interface ParsedAmount {
  negative: boolean;
  integer: string;
  fraction: string;
}

function formatMoney(amount: MoneyAmount, unit: string, options: MoneyFormatOptions = {}): string {
  const { suffix = true, digits = "fa" } = options;
  const persian = digits === "fa";
  const separator = options.separator ?? (persian ? PERSIAN_GROUP_SEPARATOR : ",");
  const { negative, integer, fraction } = parseAmount(amount);

  let body = integer.replace(/\B(?=(\d{3})+$)/g, () => separator);
  if (fraction) body += (persian ? PERSIAN_DECIMAL_SEPARATOR : ".") + fraction;
  if (persian) body = toPersianDigits(body);
  if (negative) body = (persian ? PERSIAN_MINUS : "-") + body;
  return suffix ? `${body} ${unit}` : body;
}

function parseAmount(amount: MoneyAmount): ParsedAmount {
  if (typeof amount === "bigint") {
    const negative = amount < 0n;
    return parsed(negative, (negative ? -amount : amount).toString(), "");
  }

  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) throw new RangeError(`Invalid amount: ${amount}`);
    const [integer, fraction = ""] = plainNumberString(Math.abs(amount)).split(".");
    return parsed(amount < 0, integer!, fraction);
  }

  if (typeof amount === "string") {
    const match = AMOUNT_PATTERN.exec(toEnglishDigits(amount).replace(IGNORED_IN_AMOUNT, ""));
    if (!match) throw new RangeError(`Invalid amount: ${JSON.stringify(amount)}`);
    const sign = match[1];
    return parsed(sign === "-" || sign === "\u2212", match[2]!, match[3] ?? "");
  }

  throw new TypeError(`Invalid amount type: ${typeof amount}`);
}

function parsed(negative: boolean, integer: string, fraction: string): ParsedAmount {
  const trimmedInteger = integer.replace(/^0+(?=\d)/, "");
  // "-0" and "-0.00" are not negative.
  const isZero = !/[1-9]/.test(trimmedInteger + fraction);
  return { negative: negative && !isZero, integer: trimmedInteger, fraction };
}

/**
 * `String()` without exponent notation. JavaScript only switches to exponent
 * notation for magnitudes of at least 1e21 (whole numbers) or below 1e-6, so
 * the decimal point always lands either past the digits or before them.
 */
function plainNumberString(value: number): string {
  const text = String(value);
  const match = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (!match) return text;

  const digits = match[1]! + (match[2] ?? "");
  const point = 1 + Number(match[3]);
  if (point <= 0) return `0.${"0".repeat(-point)}${digits}`;
  return digits + "0".repeat(point - digits.length);
}
