import { describe, expect, it } from "vitest";
import { LRM, arabicIndic, fa } from "../../../test/chars";
import { validatePostalCode } from "./postal-code";

const invalid = (reason: string) => ({ valid: false, reason });
const CODE = "1345678914";

describe("validatePostalCode", () => {
  it("accepts 10 digits in any script, with the usual dash or spaces", () => {
    const variants = [CODE, fa(CODE), arabicIndic(CODE), "13456-78914", fa("13456-78914"), " 13456 78914 ", `${LRM}${CODE}`];
    for (const input of variants) expect(validatePostalCode(input)).toEqual({ valid: true, value: CODE });
  });

  it("accepts 0 and 2 in the first five digits unless strict", () => {
    expect(validatePostalCode("1023456789")).toEqual({ valid: true, value: "1023456789" });
    expect(validatePostalCode("1023456789", { strict: true })).toEqual(invalid("pattern"));
    expect(validatePostalCode("1324567891", { strict: true })).toEqual(invalid("pattern"));
    expect(validatePostalCode(CODE, { strict: true })).toEqual({ valid: true, value: CODE });
    // 0 and 2 are fine in the last five digits even when strict.
    expect(validatePostalCode("1345602020", { strict: true })).toEqual({ valid: true, value: "1345602020" });
  });

  it("reports empty input", () => {
    for (const input of ["", "   ", null, undefined]) {
      expect(validatePostalCode(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports characters that aren't digits", () => {
    expect(validatePostalCode("13456abcde")).toEqual(invalid("invalidCharacters"));
  });

  it("requires exactly 10 digits", () => {
    for (const input of ["134567891", "13456789145"]) {
      expect(validatePostalCode(input)).toEqual(invalid("length"));
    }
  });

  it("rejects a single repeated digit", () => {
    expect(validatePostalCode("1111111111")).toEqual(invalid("repeatedDigits"));
    expect(validatePostalCode("0000000000", { strict: true })).toEqual(invalid("repeatedDigits"));
  });
});
