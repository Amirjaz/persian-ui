import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LRM, arabicIndic, fa } from "../../../test/chars";
import { shebaArb, shebaFromBban } from "../../../test/generators";
import { validateSheba } from "./sheba";

const invalid = (reason: string) => ({ valid: false, reason });

describe("validateSheba", () => {
  it("accepts valid numbers written in any of the usual ways", () => {
    fc.assert(
      fc.property(shebaArb, (iban) => {
        const digits = iban.slice(2);
        const grouped = iban.replace(/(.{4})/g, "$1 ").trim();
        const variants = [
          iban,
          digits,
          iban.toLowerCase(),
          grouped,
          fa(grouped),
          arabicIndic(iban),
          `IR-${digits}`,
          `${LRM}${grouped}`,
        ];
        for (const input of variants) expect(validateSheba(input)).toMatchObject({ valid: true, value: iban });
      }),
    );
  });

  it("catches every single-digit typo", () => {
    fc.assert(
      fc.property(
        shebaArb,
        fc.integer({ min: 2, max: 25 }),
        fc.integer({ min: 1, max: 9 }),
        (iban, position, shift) => {
          const chars = iban.split("");
          chars[position] = String((Number(chars[position]) + shift) % 10);
          expect(validateSheba(chars.join(""))).toEqual(invalid("checksum"));
        },
      ),
    );
  });

  it("rejects check digits 00, 01 and 99 even though they pass a bare mod-97 test", () => {
    const bbanWithCheckDigits = (checkDigits: string) => {
      for (let i = 0; ; i += 1) {
        const bban = String(i).padStart(22, "0");
        if (shebaFromBban(bban).slice(2, 4) === checkDigits) return bban;
      }
    };
    // 97 ≡ 00, 98 ≡ 01 and 02 ≡ 99 (mod 97).
    for (const [issued, congruent] of [["97", "00"], ["98", "01"], ["02", "99"]] as const) {
      const bban = bbanWithCheckDigits(issued);
      expect(validateSheba(`IR${issued}${bban}`)).toMatchObject({ valid: true });
      expect(validateSheba(`IR${congruent}${bban}`)).toEqual(invalid("checksum"));
    }
  });

  it("reports empty input", () => {
    for (const input of ["", "  ", null, undefined]) {
      expect(validateSheba(input as string)).toEqual(invalid("empty"));
    }
  });

  it("reports characters that don't belong", () => {
    for (const input of ["IR12AB3456789012345678901234", `1R${"0".repeat(24)}`, "IR06.0170"]) {
      expect(validateSheba(input)).toEqual(invalid("invalidCharacters"));
    }
  });

  it("rejects other countries' IBANs", () => {
    expect(validateSheba("DE89370400440532013000")).toEqual(invalid("country"));
  });

  it("requires 24 digits", () => {
    for (const input of ["IR", `IR${"1".repeat(23)}`, `IR${"1".repeat(25)}`, "1".repeat(23)]) {
      expect(validateSheba(input)).toEqual(invalid("length"));
    }
  });

  it("names the bank from the code after the check digits", () => {
    const melli = shebaFromBban("0170000000000000000123");
    expect(validateSheba(melli)).toEqual({ valid: true, value: melli, bank: { id: "melli", name: "بانک ملی ایران" } });

    const ansar = shebaFromBban("0630000000000000000123");
    expect(validateSheba(ansar)).toMatchObject({ bank: { id: "sepah", name: "بانک سپه", formerly: "بانک انصار" } });

    const unknown = shebaFromBban("0990000000000000000123");
    expect(validateSheba(unknown)).toMatchObject({ valid: true, bank: null });
  });
});
