import type { ValidationResult } from "../types";
import { compactDigits, invalid } from "./shared";

export type MobileOperator = "MCI" | "Irancell" | "Rightel";

export type MobileInvalidReason = "empty" | "invalidCharacters" | "countryCode" | "notMobile" | "length";

export type MobileResult = ValidationResult<
  {
    /** National format, e.g. "09121234567". */
    value: string;
    /** International format, e.g. "+989121234567". */
    e164: string;
    /**
     * The operator the number's prefix was originally allocated to, or `null`
     * for other operators and MVNOs. Numbers can be ported between operators
     * (ترابرد, since 2016), so this is not necessarily the current operator.
     */
    operator: MobileOperator | null;
  },
  MobileInvalidReason
>;

/**
 * Prefix allocations of the three main operators. There is no official public
 * table; sources (Persian and English Wikipedia, digiato.com, irancell.ir,
 * checked Sep 2026) disagree on a few edges, which are left out and resolve to
 * `null`: 0994 and 0996 (disputed between MCI and MVNOs). 0932 belonged to
 * Taliya, which merged into MCI in 2019.
 */
const OPERATOR_BY_PREFIX: Readonly<Record<string, MobileOperator>> = {
  ...prefixes("MCI", ["0910", "0911", "0912", "0913", "0914", "0915", "0916", "0917", "0918", "0919", "0990", "0991", "0992", "0993", "0932"]),
  ...prefixes("Irancell", ["0900", "0901", "0902", "0903", "0904", "0905", "0930", "0933", "0935", "0936", "0937", "0938", "0939", "0941"]),
  ...prefixes("Rightel", ["0920", "0921", "0922", "0923"]),
};

/**
 * Validates an Iranian mobile number and normalizes it.
 *
 * Accepts `09xxxxxxxxx`, `+989xxxxxxxxx`, `00989xxxxxxxxx`, `989xxxxxxxxx` and
 * `9xxxxxxxxx`, in any digit script, with spaces, dashes, dots or parentheses.
 * Any `09` number with 11 digits is valid, so newly allocated prefixes keep
 * working; `operator` is `null` for prefixes outside the three main operators.
 */
export function validateIranianMobile(number: string): MobileResult {
  const compact = compactDigits(number, /[().]/g);
  if (compact === "") return invalid("empty");
  if (!/^\+?\d+$/.test(compact)) return invalid("invalidCharacters");

  let national: string;
  if (compact.startsWith("+") || compact.startsWith("00")) {
    const withoutPlus = compact.replace(/^(\+|00)/, "");
    if (!withoutPlus.startsWith("98")) return invalid("countryCode");
    // "+98 0912…": people often keep the trunk zero after the country code.
    national = withoutPlus.slice(2).replace(/^0/, "");
  } else if (compact.startsWith("98") && compact.length === 12) {
    national = compact.slice(2);
  } else {
    national = compact.replace(/^0/, "");
  }

  if (national === "") return invalid("length");
  if (!national.startsWith("9")) return invalid("notMobile");
  if (national.length !== 10) return invalid("length");

  const value = `0${national}`;
  return {
    valid: true,
    value,
    e164: `+98${national}`,
    operator: OPERATOR_BY_PREFIX[value.slice(0, 4)] ?? null,
  };
}

function prefixes(operator: MobileOperator, list: string[]): Record<string, MobileOperator> {
  return Object.fromEntries(list.map((prefix) => [prefix, operator]));
}
