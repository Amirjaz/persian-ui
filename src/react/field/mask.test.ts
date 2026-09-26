import { describe, expect, it } from "vitest";
import { fa } from "../../../test/chars";
import { caretAfter, digitGroupsMask, extractSignificant, groupDigits, toDisplay } from "./mask";

const mask = digitGroupsMask([3, 6, 1], "-");

describe("mask helpers", () => {
  it("groups digits without a trailing separator", () => {
    expect(groupDigits("", [3, 6, 1], "-")).toBe("");
    expect(groupDigits("001", [3, 6, 1], "-")).toBe("001");
    expect(groupDigits("0012", [3, 6, 1], "-")).toBe("001-2");
    expect(groupDigits("0012345678", [3, 6, 1], "-")).toBe("001-234567-8");
  });

  it("caps the length", () => {
    expect(mask.sanitize("001234567890")).toBe("0012345678");
  });

  it("extracts significant characters from any digit script", () => {
    expect(extractSignificant(fa("001-23"), 4, mask)).toEqual({ value: "00123", beforeCaret: 3 });
    expect(extractSignificant("0a1", 3, mask)).toEqual({ value: "01", beforeCaret: 2 });
  });

  it("renders the display in the chosen digits", () => {
    expect(toDisplay("0012", mask, "fa")).toBe(fa("001-2"));
    expect(toDisplay("0012", mask, "en")).toBe("001-2");
  });

  it("places the caret after the n-th significant character", () => {
    expect(caretAfter("001-234", 0, mask)).toBe(0);
    expect(caretAfter("001-234", 3, mask)).toBe(3);
    expect(caretAfter("001-234", 4, mask)).toBe(5);
    expect(caretAfter(fa("001-234"), 4, mask)).toBe(5);
    expect(caretAfter("001-234", 99, mask)).toBe(7);
  });
});
