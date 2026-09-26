import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arabicIndic, fa } from "../../test/chars";
import { toEnglishDigits, toPersianDigits } from "./digits";

const LATIN = "0123456789";

describe("toPersianDigits", () => {
  it("converts Latin and Arabic-Indic digits to Persian digits", () => {
    expect(toPersianDigits(LATIN)).toBe(fa(LATIN));
    expect(toPersianDigits(arabicIndic(LATIN))).toBe(fa(LATIN));
  });

  it("leaves Persian digits and every other character alone", () => {
    const text = `${fa(LATIN)} abc /-.,:`;
    expect(toPersianDigits(text)).toBe(text);
    expect(toPersianDigits("1404/01/15")).toBe(fa("1404/01/15"));
  });

  it("stringifies numbers and bigints", () => {
    expect(toPersianDigits(1404)).toBe(fa("1404"));
    expect(toPersianDigits(-12.5)).toBe(fa("-12.5"));
    expect(toPersianDigits(12345678901234567890n)).toBe(fa("12345678901234567890"));
  });

  it("returns an empty string for empty input", () => {
    expect(toPersianDigits("")).toBe("");
  });
});

describe("toEnglishDigits", () => {
  it("converts Persian and Arabic-Indic digits to Latin digits", () => {
    expect(toEnglishDigits(fa(LATIN))).toBe(LATIN);
    expect(toEnglishDigits(arabicIndic(LATIN))).toBe(LATIN);
  });

  it("handles mixed scripts in one string", () => {
    expect(toEnglishDigits(`${fa("0912")} ${arabicIndic("345")} 6789`)).toBe("0912 345 6789");
  });

  it("stringifies numbers", () => {
    expect(toEnglishDigits(42)).toBe("42");
  });
});

describe("digit conversion properties", () => {
  it("round-trips any text", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        expect(toEnglishDigits(toPersianDigits(text))).toBe(toEnglishDigits(text));
        expect(toPersianDigits(toEnglishDigits(text))).toBe(toPersianDigits(text));
      }),
    );
  });
});
