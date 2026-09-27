import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arabicIndic, fa, faNumber } from "../../test/chars";
import { numberToWords } from "./words";

describe("numberToWords", () => {
  it.each([
    [0, "صفر"],
    [1, "یک"],
    [7, "هفت"],
    [10, "ده"],
    [11, "یازده"],
    [18, "هجده"],
    [19, "نوزده"],
    [20, "بیست"],
    [21, "بیست و یک"],
    [99, "نود و نه"],
    [100, "صد"],
    [101, "صد و یک"],
    [115, "صد و پانزده"],
    [230, "دویست و سی"],
    [999, "نهصد و نود و نه"],
    [1000, "یک هزار"],
    [1001, "یک هزار و یک"],
    [2025, "دو هزار و بیست و پنج"],
    [10_000, "ده هزار"],
    [100_500, "صد هزار و پانصد"],
    [1_000_000, "یک میلیون"],
    [1_000_001, "یک میلیون و یک"],
    [1_250_000, "یک میلیون و دویست و پنجاه هزار"],
    [3_000_000_000, "سه میلیارد"],
    [45_000_000_000_000, "چهل و پنج تریلیون"],
    [9_007_199_254_740_991, "نه کوادریلیون و هفت تریلیون و صد و نود و نه میلیارد و دویست و پنجاه و چهار میلیون و هفتصد و چهل هزار و نهصد و نود و یک"],
  ])("writes %s as «%s»", (value, words) => {
    expect(numberToWords(value)).toBe(words);
  });

  it("writes negative numbers with «منفی», and zero without a sign", () => {
    expect(numberToWords(-7)).toBe("منفی هفت");
    expect(numberToWords("-1250000")).toBe("منفی یک میلیون و دویست و پنجاه هزار");
    expect(numberToWords(-0)).toBe("صفر");
    expect(numberToWords("-0")).toBe("صفر");
  });

  it("accepts bigints and numeric strings in any digit script, with separators", () => {
    const words = "یک میلیون و دویست و پنجاه هزار";
    for (const input of [1250000n, "1250000", "1,250,000", faNumber("1,250,000"), arabicIndic("1250000"), fa("1 250 000"), "1250000.00"]) {
      expect(numberToWords(input)).toBe(words);
    }
  });

  it("goes up to 10¹⁸ − 1", () => {
    expect(numberToWords(10n ** 18n - 1n)).toBe(
      "نهصد و نود و نه کوادریلیون و نهصد و نود و نه تریلیون و نهصد و نود و نه میلیارد و نهصد و نود و نه میلیون و نهصد و نود و نه هزار و نهصد و نود و نه",
    );
    expect(numberToWords("1000000000000000")).toBe("یک کوادریلیون");
  });

  it("gives the same words for a number, its bigint and its string", () => {
    fc.assert(
      fc.property(fc.maxSafeInteger(), (value) => {
        const words = numberToWords(value);
        expect(numberToWords(BigInt(value))).toBe(words);
        expect(numberToWords(String(value))).toBe(words);
        // No digits, doubled or stray spaces, and no «و» left dangling at either end.
        expect(words).not.toMatch(/\d|\s{2}|^\s|\s$|^و\s|\sو$/);
      }),
    );
  });

  it("throws for fractions, unsafe numbers, values of 10¹⁸ or more and malformed input", () => {
    for (const input of [1.5, "12.5", "۱۲٫۵", 2 ** 53, 1e21, 10n ** 18n, "1000000000000000000", Number.NaN, Infinity, "", "12a", "1-2"]) {
      expect(() => numberToWords(input), String(input)).toThrow(RangeError);
    }
  });
});
