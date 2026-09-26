import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ARABIC_DECIMAL_SEPARATOR,
  ARABIC_KAF,
  ARABIC_YEH,
  LRM,
  MINUS_SIGN,
  PERSIAN_YEH,
  arabicIndic,
  fa,
  faNumber,
} from "../../test/chars";
import { formatRial, formatToman, type MoneyAmount } from "./money";

const TOMAN = "تومان";
const RIAL = `ر${PERSIAN_YEH}ال`;
const PERSIAN_NEGATIVE = `${LRM}${MINUS_SIGN}`;
const bare = (amount: MoneyAmount) => formatToman(amount, { suffix: false });
const latin = (amount: MoneyAmount) => formatToman(amount, { suffix: false, digits: "en" });

describe("formatToman / formatRial", () => {
  it("uses Persian digits, the Persian thousands separator and the unit", () => {
    expect(formatToman(1250000)).toBe(`${faNumber("1,250,000")} ${TOMAN}`);
    expect(formatRial(1250000)).toBe(`${faNumber("1,250,000")} ${RIAL}`);
  });

  it("spells the units with Persian letters", () => {
    const arabicLetters = new RegExp(`[${ARABIC_YEH}${ARABIC_KAF}]`);
    expect(formatToman(1)).not.toMatch(arabicLetters);
    expect(formatRial(1)).not.toMatch(arabicLetters);
  });

  it("can leave the unit out", () => {
    expect(bare(1250000)).toBe(faNumber("1,250,000"));
    expect(formatRial(1250000, { suffix: false })).toBe(faNumber("1,250,000"));
  });

  it("can use Latin digits, with a comma separator", () => {
    expect(formatToman(1250000, { digits: "en" })).toBe(`1,250,000 ${TOMAN}`);
  });

  it("accepts a custom separator", () => {
    expect(formatToman(1250000, { separator: "," })).toBe(`${fa("1,250,000")} ${TOMAN}`);
    expect(formatToman(1234567, { digits: "en", separator: "$&", suffix: false })).toBe("1$&234$&567");
  });

  it("groups digits in threes only where needed", () => {
    expect(latin(0)).toBe("0");
    expect(latin(999)).toBe("999");
    expect(latin(1000)).toBe("1,000");
    expect(latin(100000)).toBe("100,000");
    expect(latin(1000000)).toBe("1,000,000");
  });

  it("formats decimals with the Persian decimal separator", () => {
    expect(bare(1234.5)).toBe(faNumber("1,234.5"));
    expect(latin(1234.5)).toBe("1,234.5");
    expect(latin(0.25)).toBe("0.25");
  });

  it("formats negative amounts the way CLDR does", () => {
    expect(formatToman(-1500)).toBe(`${PERSIAN_NEGATIVE}${faNumber("1,500")} ${TOMAN}`);
    expect(formatToman(-1500, { digits: "en" })).toBe(`-1,500 ${TOMAN}`);
  });

  it("never shows a negative zero", () => {
    expect(bare(-0)).toBe(fa("0"));
    expect(bare("-0")).toBe(fa("0"));
    expect(bare("-0.00")).toBe(faNumber("0.00"));
  });

  it("formats bigints beyond Number.MAX_SAFE_INTEGER exactly", () => {
    expect(bare(12345678901234567890n)).toBe(faNumber("12,345,678,901,234,567,890"));
    expect(bare(-5n)).toBe(`${PERSIAN_NEGATIVE}${fa("5")}`);
  });

  it("writes out numbers that JavaScript prints in exponent notation", () => {
    expect(latin(1e21)).toBe("1,000,000,000,000,000,000,000");
    expect(latin(1.5e21)).toBe("1,500,000,000,000,000,000,000");
    expect(latin(1e-7)).toBe("0.0000001");
    expect(latin(1.5e-7)).toBe("0.00000015");
  });

  it("parses numeric strings in any digit script and grouping", () => {
    const inputs = [
      "1250000",
      fa("1250000"),
      arabicIndic("1250000"),
      "1,250,000",
      faNumber("1,250,000"),
      " 1 250 000 ",
      "+1250000",
      "0001250000",
    ];
    for (const input of inputs) expect(latin(input)).toBe("1,250,000");
    expect(latin("1234.50")).toBe("1,234.50");
    expect(latin(`${fa("1234")}${ARABIC_DECIMAL_SEPARATOR}${fa("5")}`)).toBe("1,234.5");
    expect(latin(`${MINUS_SIGN}1500`)).toBe("-1,500");
    expect(latin("-1500")).toBe("-1,500");
  });

  it("accepts its own output as input", () => {
    expect(bare(bare(-1234567.5))).toBe(bare(-1234567.5));
  });

  it("rejects amounts that aren't numbers", () => {
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => formatToman(amount)).toThrow(RangeError);
    }
    for (const amount of ["", "abc", "1.2.3", "12 تومان", ".5", "1."]) {
      expect(() => formatToman(amount)).toThrow(RangeError);
    }
    for (const amount of [null, undefined, {}, true]) {
      expect(() => formatToman(amount as unknown as MoneyAmount)).toThrow(TypeError);
    }
  });
});

describe("money formatting properties", () => {
  const persianNumbers = new Intl.NumberFormat("fa-IR");

  it("matches Intl.NumberFormat('fa-IR') for integers and tenths", () => {
    const amounts = fc.oneof(
      fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
      fc.integer({ min: -1e9, max: 1e9 }).map((tenths) => tenths / 10),
    );
    fc.assert(fc.property(amounts, (amount) => {
      expect(bare(amount)).toBe(persianNumbers.format(amount));
    }));
  });

  it("is stable when fed its own output", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }), (amount) => {
        expect(bare(bare(amount))).toBe(bare(amount));
      }),
    );
  });
});
