import { describe, expect, it } from "vitest";
import { ARABIC_KAF, ARABIC_YEH, fa } from "../../test/chars";
import { validationMessages } from "./messages";

describe("validationMessages", () => {
  const all = Object.entries(validationMessages).flatMap(([validator, messages]) =>
    Object.entries(messages).map(([reason, message]) => ({ validator, reason, message: message as string })),
  );

  it("has a Persian message for every reason", () => {
    expect(all.length).toBeGreaterThan(20);
    for (const { message } of all) expect(message).toMatch(/[؀-ۿ]{2}/);
  });

  it("writes numbers with Persian digits and uses Persian yeh and kaf", () => {
    const arabicLetters = new RegExp(`[${ARABIC_YEH}${ARABIC_KAF}]`);
    for (const { message } of all) {
      expect(message).not.toMatch(/[0-9]/);
      expect(message).not.toMatch(arabicLetters);
    }
    expect(validationMessages.nationalId.length).toContain(fa("10"));
    expect(validationMessages.sheba.length).toContain(fa("24"));
    expect(validationMessages.card.length).toContain(fa("16"));
  });
});
