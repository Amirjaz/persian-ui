import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LRM, ZWNJ, arabicIndic, fa } from "../../../test/chars";
import { cardNumberArb, cardNumberFromBody } from "../../../test/generators";
import { validateCardNumber } from "./card";

const invalid = (reason: string) => ({ valid: false, reason });

describe("validateCardNumber", () => {
  it("accepts valid numbers written in any of the usual ways", () => {
    fc.assert(
      fc.property(cardNumberArb("603799"), (card) => {
        const grouped = card.replace(/(\d{4})(?=\d)/g, "$1 ");
        const variants = [card, grouped, grouped.replace(/ /g, "-"), fa(grouped), arabicIndic(card), `${LRM}${grouped}`, `6037${ZWNJ}${card.slice(4)}`];
        for (const input of variants) {
          expect(validateCardNumber(input)).toEqual({
            valid: true,
            value: card,
            bank: { id: "melli", name: "بانک ملی ایران" },
          });
        }
      }),
    );
  });

  it("catches every single-digit typo", () => {
    fc.assert(
      fc.property(
        cardNumberArb("610433"),
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 1, max: 9 }),
        (card, position, shift) => {
          const chars = card.split("");
          chars[position] = String((Number(chars[position]) + shift) % 10);
          const typo = chars.join("");
          fc.pre(!/^(\d)\1*$/.test(typo));
          expect(validateCardNumber(typo)).toEqual(invalid("checksum"));
        },
      ),
    );
  });

  it("validates cards from banks it doesn't know, without a bank", () => {
    const card = cardNumberFromBody("400000123456789");
    expect(validateCardNumber(card)).toEqual({ valid: true, value: card, bank: null });
  });

  it("reports the current bank for cards of merged banks", () => {
    const card = cardNumberFromBody("627381000000001");
    expect(validateCardNumber(card)).toMatchObject({
      valid: true,
      bank: { id: "sepah", name: "بانک سپه", formerly: "بانک انصار" },
    });
  });

  it("reports empty input", () => {
    for (const input of ["", "  ", null, undefined]) {
      expect(validateCardNumber(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports characters that don't belong", () => {
    for (const input of ["6037 99xx 1234 5678", "6037.9912.3456.7890", "IR06"]) {
      expect(validateCardNumber(input)).toEqual(invalid("invalidCharacters"));
    }
  });

  it("requires 16 digits", () => {
    const card = cardNumberFromBody("603799000000000");
    for (const input of ["6", card.slice(0, 15), `${card}0`, "603799"]) {
      expect(validateCardNumber(input)).toEqual(invalid("length"));
    }
  });

  it("rejects a number made of one repeated digit, even when it passes the checksum", () => {
    expect(validateCardNumber("0000 0000 0000 0000")).toEqual(invalid("repeatedDigits"));
    expect(validateCardNumber("5555555555555555")).toEqual(invalid("repeatedDigits"));
  });
});
