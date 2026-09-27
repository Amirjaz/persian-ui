import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ALEF_MADDA, ARABIC_KAF, ARABIC_YEH, PERSIAN_KAF, PERSIAN_YEH, ZWNJ, fa } from "../../test/chars";
import { fixKeyboardLayout } from "./keyboard";

/** Every character a US keyboard produces, without and with Shift. */
const US_KEYS = "`1234567890-=qwertyuiop[]asdfghjkl;'zxcvbnm,./" + '~!@#$%^&*()_+QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?';

describe("fixKeyboardLayout", () => {
  it("retypes Persian that was typed with the English layout active", () => {
    expect(fixKeyboardLayout("sghl", "fa")).toBe("سلام");
    expect(fixKeyboardLayout("sghl o,fd?", "fa")).toBe("سلام خوبی؟");
    expect(fixKeyboardLayout("[hk ]dk", "fa")).toBe("جان چین");
  });

  it("retypes English that was typed with the Persian layout active", () => {
    expect(fixKeyboardLayout("اثممخ", "en")).toBe("hello");
    expect(fixKeyboardLayout("سلام خوبی؟", "en")).toBe("sghl o,fd?");
  });

  it("produces the Persian forms of yeh and kaf, and the Arabic ones with Shift", () => {
    expect(fixKeyboardLayout("d;", "fa")).toBe(PERSIAN_YEH + PERSIAN_KAF);
    expect(fixKeyboardLayout("DZ", "fa")).toBe(ARABIC_YEH + ARABIC_KAF);
  });

  it("treats uppercase letters as Shift", () => {
    expect(fixKeyboardLayout("Hk", "fa")).toBe(`${ALEF_MADDA}ن`);
    expect(fixKeyboardLayout("C", "fa")).toBe("ژ");
    // Shift+B is the ZWNJ key: «می‌روم».
    expect(fixKeyboardLayout("ldBv,l", "fa")).toBe(`می${ZWNJ}روم`);
  });

  it("maps the number row to Persian digits and back", () => {
    expect(fixKeyboardLayout("1404", "fa")).toBe(fa("1404"));
    expect(fixKeyboardLayout(fa("1404"), "en")).toBe("1404");
  });

  it("leaves characters that no key produces unchanged", () => {
    expect(fixKeyboardLayout("سلام\n😀 ", "fa")).toBe("سلام\n😀 ");
    expect(fixKeyboardLayout("hello 😀", "en")).toBe("hello 😀");
  });

  it("round-trips everything a keyboard can type", () => {
    const usText = fc.string({ unit: fc.constantFrom(...US_KEYS, " ") });
    fc.assert(
      fc.property(usText, (text) => {
        const persian = fixKeyboardLayout(text, "fa");
        expect(fixKeyboardLayout(persian, "en")).toBe(text);
      }),
    );
  });

  it("maps every key", () => {
    for (const key of US_KEYS) {
      const persian = fixKeyboardLayout(key, "fa");
      expect(persian, key).not.toBe("");
      expect([...persian], key).toHaveLength(1);
    }
    const persianKeys = [...US_KEYS].map((key) => fixKeyboardLayout(key, "fa"));
    expect(new Set(persianKeys).size).toBe(US_KEYS.length);
  });
});
