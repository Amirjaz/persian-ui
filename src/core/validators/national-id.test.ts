import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EN_DASH, LRM, ZWNJ, arabicIndic, fa } from "../../../test/chars";
import {
  nationalIdArb,
  nationalIdFromBody,
  zeroPrefixedNationalIdArb,
} from "../../../test/generators";
import { validateNationalId } from "./national-id";

const invalid = (reason: string) => ({ valid: false, reason });

describe("validateNationalId", () => {
  it("accepts valid codes", () => {
    fc.assert(
      fc.property(nationalIdArb, (id) => {
        expect(validateNationalId(id)).toEqual({ valid: true, value: id });
      }),
    );
  });

  it("accepts any digit script, dashes, spaces and pasted invisible marks", () => {
    fc.assert(
      fc.property(nationalIdArb, (id) => {
        const printed = `${id.slice(0, 3)}-${id.slice(3, 9)}-${id.slice(9)}`;
        const variants = [
          fa(id),
          arabicIndic(id),
          printed,
          fa(printed),
          ` ${id} `,
          `${id.slice(0, 5)} ${id.slice(5)}`,
          `${id.slice(0, 3)}${EN_DASH}${id.slice(3)}`,
          `${LRM}${id}`,
          `${id.slice(0, 4)}${ZWNJ}${id.slice(4)}`,
        ];
        for (const input of variants) expect(validateNationalId(input)).toEqual({ valid: true, value: id });
      }),
    );
  });

  it("rejects every wrong check digit", () => {
    fc.assert(
      fc.property(nationalIdArb, fc.integer({ min: 1, max: 9 }), (id, shift) => {
        const wrong = id.slice(0, 9) + String((Number(id[9]) + shift) % 10);
        expect(validateNationalId(wrong)).toEqual(invalid("checksum"));
      }),
    );
  });

  it("rejects codes made of one repeated digit, although they pass the checksum", () => {
    for (let digit = 0; digit <= 9; digit += 1) {
      const code = String(digit).repeat(10);
      expect(nationalIdFromBody(String(digit).repeat(9))).toBe(code);
      expect(validateNationalId(code)).toEqual(invalid("repeatedDigits"));
    }
  });

  it("rejects codes whose digits 4 to 9 are all zero", () => {
    expect(validateNationalId(nationalIdFromBody("123000000"))).toEqual(invalid("zeroSerial"));
  });

  it("reports empty input", () => {
    for (const input of ["", "   ", ZWNJ, null, undefined]) {
      expect(validateNationalId(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports characters that aren't digits", () => {
    for (const input of ["12345abcde", `${fa("123456789")}x`, "123.456.789"]) {
      expect(validateNationalId(input)).toEqual(invalid("invalidCharacters"));
    }
  });

  it("requires exactly 10 digits", () => {
    for (const input of ["1", "123456789", "12345678901"]) {
      expect(validateNationalId(input)).toEqual(invalid("length"));
    }
  });

  it("restores dropped leading zeros only with padShort", () => {
    fc.assert(
      fc.property(zeroPrefixedNationalIdArb, (id) => {
        const withoutZeros = id.slice(2);
        const withoutOneZero = id.slice(1);
        expect(validateNationalId(withoutZeros)).toEqual(invalid("length"));
        expect(validateNationalId(withoutZeros, { padShort: true })).toEqual({ valid: true, value: id });
        expect(validateNationalId(withoutOneZero, { padShort: true })).toEqual({ valid: true, value: id });
        expect(validateNationalId(id, { padShort: true })).toEqual({ valid: true, value: id });
      }),
    );
    expect(validateNationalId("1234567", { padShort: true })).toEqual(invalid("length"));
  });
});
