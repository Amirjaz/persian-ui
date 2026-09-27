import { describe, expect, it } from "vitest";
import { ARABIC_KAF, ARABIC_YEH, LRM, ZWNJ, fa } from "../../test/chars";
import { cardNumberFromBody, shebaFromBban } from "../../test/generators";
import { IRANIAN_BANKS, getBankFromCardNumber, getBankFromSheba } from "./banks";

const MELLI = { id: "melli", name: "بانک ملی ایران" };
const SEPAH = { id: "sepah", name: "بانک سپه" };

describe("IRANIAN_BANKS", () => {
  it("has unique ids, card prefixes and Sheba codes", () => {
    const ids = IRANIAN_BANKS.map((bank) => bank.id);
    const prefixes = IRANIAN_BANKS.flatMap((bank) => bank.cardPrefixes);
    const codes = IRANIAN_BANKS.flatMap((bank) => bank.shebaCodes);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(new Set(codes).size).toBe(codes.length);
    for (const prefix of prefixes) expect(prefix).toMatch(/^\d{6}$/);
    for (const code of codes) expect(code).toMatch(/^\d{3}$/);
  });

  it("merges only into banks that still exist", () => {
    for (const bank of IRANIAN_BANKS.filter((record) => record.mergedInto)) {
      const target = IRANIAN_BANKS.find((record) => record.id === bank.mergedInto);
      expect(target, bank.id).toBeDefined();
      expect(target!.mergedInto).toBeUndefined();
    }
  });

  it("writes names with Persian yeh and kaf", () => {
    const arabicLetters = new RegExp(`[${ARABIC_YEH}${ARABIC_KAF}]`);
    for (const bank of IRANIAN_BANKS) expect(bank.name).not.toMatch(arabicLetters);
  });
});

describe("getBankFromCardNumber", () => {
  it("finds the bank from the first six digits, however the number is written", () => {
    const card = cardNumberFromBody("603799000000000");
    for (const input of [card, "6037 99", `${LRM}6037-9900`, fa(card)]) {
      expect(getBankFromCardNumber(input)).toEqual(MELLI);
    }
    expect(getBankFromCardNumber("6104 33")).toEqual({ id: "mellat", name: "بانک ملت" });
  });

  it("reports the current bank for cards of merged institutions", () => {
    expect(getBankFromCardNumber("627381")).toEqual({ ...SEPAH, formerly: "بانک انصار" });
    expect(getBankFromCardNumber("639370")).toEqual({ ...SEPAH, formerly: "بانک مهر اقتصاد" });
    expect(getBankFromCardNumber("507677")).toEqual({ ...MELLI, formerly: "مؤسسه اعتباری نور" });
    expect(getBankFromCardNumber("636214")).toEqual({ ...MELLI, formerly: "بانک آینده" });
  });

  it("returns null for unknown prefixes and fewer than six digits", () => {
    for (const input of ["", "60379", "123456", "4111 1111 1111 1111", "abcdef"]) {
      expect(getBankFromCardNumber(input)).toBeNull();
    }
  });
});

describe("getBankFromSheba", () => {
  it("reads the bank code after IR and the check digits", () => {
    const iban = shebaFromBban("0170000000000000000123");
    for (const input of [iban, iban.slice(2), iban.toLowerCase(), "IR06 017", fa(iban.slice(2))]) {
      expect(getBankFromSheba(input)).toEqual(MELLI);
    }
  });

  it("knows every code of a bank and the codes of merged institutions", () => {
    expect(getBankFromSheba("IR00060")).toEqual({ id: "mehr-iran", name: `بانک قرض${ZWNJ}الحسنه مهر ایران` });
    expect(getBankFromSheba("IR00090")).toMatchObject({ id: "mehr-iran" });
    expect(getBankFromSheba("IR00052")).toEqual({ ...SEPAH, formerly: "بانک قوامین" });
    expect(getBankFromSheba("IR00062")).toEqual({ ...MELLI, formerly: "بانک آینده" });
  });

  it("returns null for unknown codes and numbers too short to contain one", () => {
    for (const input of ["", "IR", "IR0601", "IR06099"]) expect(getBankFromSheba(input)).toBeNull();
  });
});
