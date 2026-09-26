import { describe, expect, it } from "vitest";
import { ARABIC_KAF, ARABIC_YEH, PERSIAN_KAF, PERSIAN_YEH, arabicIndic, fa } from "../../../test/chars";
import { PLATE_LETTERS, validatePlate } from "./plate";

const invalid = (reason: string) => ({ valid: false, reason });
const LETTER = "ب";
const EXPECTED = {
  valid: true,
  value: `12${LETTER}345-67`,
  parts: { twoDigit: "12", letter: LETTER, threeDigit: "345", region: "67" },
};

describe("validatePlate", () => {
  it("understands the common spellings", () => {
    const inputs = [
      `12${LETTER}345-67`,
      `${fa("12")} ${LETTER} ${fa("345")} - ${fa("67")}`,
      `12 ${LETTER} 345 ایران 67`,
      `12${LETTER}34567`,
      `ایران 67 12${LETTER}345`,
      `67 ایران 12 ${LETTER} 345`,
      `12 | ${LETTER} | 345 | 67`,
      arabicIndic(`12${LETTER}34567`),
    ];
    for (const input of inputs) expect(validatePlate(input)).toEqual(EXPECTED);
  });

  it("accepts every issued letter", () => {
    for (const letter of PLATE_LETTERS) {
      expect(validatePlate(`12${letter}34567`)).toMatchObject({ valid: true, parts: { letter } });
    }
  });

  it("lists letters with Persian yeh and kaf", () => {
    expect(PLATE_LETTERS).toContain(PERSIAN_YEH);
    expect(PLATE_LETTERS).toContain(PERSIAN_KAF);
    expect(PLATE_LETTERS).not.toContain(ARABIC_YEH);
    expect(PLATE_LETTERS).not.toContain(ARABIC_KAF);
  });

  it("reads «ا» as «الف» and Arabic yeh/kaf as the Persian letters", () => {
    expect(validatePlate("12ا34567")).toMatchObject({ valid: true, value: "12الف345-67" });
    expect(validatePlate(`12${ARABIC_YEH}34567`)).toMatchObject({ parts: { letter: PERSIAN_YEH } });
    expect(validatePlate(`12${ARABIC_KAF}34567`)).toMatchObject({ parts: { letter: PERSIAN_KAF } });
  });

  it("reports empty input", () => {
    for (const input of ["", "  ", null, undefined]) {
      expect(validatePlate(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports malformed plates", () => {
    const inputs = [
      `12${LETTER}3456`,
      `1${LETTER}34567`,
      `12${LETTER}34567ایران`,
      `ایران ایران 12${LETTER}34567`,
      "ایران abc",
      `12${LETTER}345 ایران 6`,
    ];
    for (const input of inputs) expect(validatePlate(input)).toEqual(invalid("format"));
  });

  it("rejects letters that aren't issued", () => {
    for (const input of ["12X34567", "12ح34567", "12DS34567"]) {
      expect(validatePlate(input)).toEqual(invalid("letter"));
    }
  });

  it("rejects region codes below 10", () => {
    expect(validatePlate(`12${LETTER}34505`)).toEqual(invalid("region"));
  });

  it("rejects zeros in the number groups only when strict", () => {
    expect(validatePlate(`10${LETTER}34567`)).toMatchObject({ valid: true });
    expect(validatePlate(`10${LETTER}34567`, { strict: true })).toEqual(invalid("zeroDigit"));
    expect(validatePlate(`12${LETTER}30567`, { strict: true })).toEqual(invalid("zeroDigit"));
    expect(validatePlate(`12${LETTER}34510`, { strict: true })).toMatchObject({ valid: true });
  });
});
