import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LRM, ZWNJ, arabicIndic, fa } from "../../../test/chars";
import { validateIranianMobile, type MobileOperator } from "./mobile";

const invalid = (reason: string) => ({ valid: false, reason });

describe("validateIranianMobile", () => {
  it("normalizes every accepted format", () => {
    const inputs = [
      "09121234567",
      "+989121234567",
      "00989121234567",
      "989121234567",
      "9121234567",
      "+98 912 123 4567",
      "+98 (912) 123-4567",
      "0912.123.4567",
      "+98 0912 123 4567",
      "0098-0912-123-4567",
      fa("09121234567"),
      arabicIndic("+989121234567"),
      `${LRM}+98 912 123 4567`,
      `0912${ZWNJ}1234567`,
    ];
    for (const input of inputs) {
      expect(validateIranianMobile(input)).toEqual({
        valid: true,
        value: "09121234567",
        e164: "+989121234567",
        operator: "MCI",
      });
    }
  });

  it("names the operator a prefix was allocated to", () => {
    const expected: Record<string, MobileOperator | null> = {
      "0910": "MCI",
      "0919": "MCI",
      "0990": "MCI",
      "0993": "MCI",
      "0932": "MCI",
      "0900": "Irancell",
      "0905": "Irancell",
      "0930": "Irancell",
      "0933": "Irancell",
      "0935": "Irancell",
      "0939": "Irancell",
      "0941": "Irancell",
      "0920": "Rightel",
      "0923": "Rightel",
      "0931": null,
      "0934": null,
      "0994": null,
      "0996": null,
      "0998": null,
      "0999": null,
    };
    for (const [prefix, operator] of Object.entries(expected)) {
      expect(validateIranianMobile(`${prefix}1234567`)).toMatchObject({ valid: true, operator });
    }
  });

  it("accepts any 09 number, so new prefixes keep working", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^9\d{9}$/), (national) => {
        expect(validateIranianMobile(`0${national}`)).toMatchObject({
          valid: true,
          value: `0${national}`,
          e164: `+98${national}`,
        });
      }),
    );
  });

  it("reports empty input", () => {
    for (const input of ["", "   ", null, undefined]) {
      expect(validateIranianMobile(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports characters that don't belong in a phone number", () => {
    for (const input of ["0912abc4567", "++989121234567", "0912+1234567", "0912/123/4567"]) {
      expect(validateIranianMobile(input)).toEqual(invalid("invalidCharacters"));
    }
  });

  it("rejects foreign numbers", () => {
    for (const input of ["+1 555 123 4567", "0044 20 7946 0958"]) {
      expect(validateIranianMobile(input)).toEqual(invalid("countryCode"));
    }
  });

  it("rejects landlines", () => {
    for (const input of ["02188776655", "+98 21 8877 6655", "8121234567"]) {
      expect(validateIranianMobile(input)).toEqual(invalid("notMobile"));
    }
  });

  it("requires 11 digits in the national format", () => {
    for (const input of ["0912123456", "091212345678", "98912123456", "+98", "0"]) {
      expect(validateIranianMobile(input)).toEqual(invalid("length"));
    }
  });
});
