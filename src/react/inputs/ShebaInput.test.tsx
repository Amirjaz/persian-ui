import { validationMessages } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fa } from "../../../test/chars";
import { shebaFromBban } from "../../../test/generators";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { getDirection } from "../direction";
import { ShebaInput, type ShebaInputProps } from "./ShebaInput";

// Generated from the ISO 13616 checksum; not a real account.
const IBAN = shebaFromBban("0120000000000000000123");
const DIGITS = IBAN.slice(2);
const grouped = (digits: string) => digits.replace(/^(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})$/, "$1 $2 $3 $4 $5 $6 $7");

function setup(props: Partial<ShebaInputProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<ShebaInput label="شماره شبا" onValueChange={onValueChange} {...props} />);
  const input = screen.getByLabelText("شماره شبا") as HTMLInputElement;
  return { ...view, user, input, onValueChange };
}

describe("ShebaInput", () => {
  it("shows IR as a fixed prefix hidden from screen readers", () => {
    const { container } = setup();
    const affix = container.querySelector(".pui-field__affix")!;
    expect(affix).toHaveTextContent("IR");
    expect(affix).toHaveAttribute("aria-hidden", "true");
  });

  it("groups the digits like the printed number and reports the full IBAN", async () => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, DIGITS);
    expect(input).toHaveValue(grouped(DIGITS));
    expect(onValueChange).toHaveBeenLastCalledWith(IBAN, { valid: true, value: IBAN });
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("accepts a pasted IBAN with spaces and Persian digits", async () => {
    const { user, input, onValueChange } = setup();
    await user.click(input);
    await user.paste(`IR${fa(grouped(DIGITS))}`);
    expect(onValueChange).toHaveBeenLastCalledWith(IBAN, { valid: true, value: IBAN });
    expect(input).toHaveValue(fa(grouped(DIGITS)));
  });

  it("reports a wrong checksum once all 24 digits are in", async () => {
    const { user, input } = setup();
    const wrong = DIGITS.slice(0, 23) + String((Number(DIGITS[23]) + 1) % 10);
    await user.type(input, wrong);
    expect(input).toHaveAccessibleDescription(validationMessages.sheba.checksum);
  });

  it("reports an empty value once cleared", async () => {
    const { user, input, onValueChange } = setup({ defaultValue: IBAN });
    await user.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith("", { valid: false, reason: "empty" });
  });

  it("takes a controlled value with or without IR and submits it with IR", () => {
    const { input, container } = setup({ value: IBAN, name: "sheba", digits: "en" });
    expect(input).toHaveValue(grouped(DIGITS));
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe(IBAN);
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("keeps IR and the digits left to right", async () => {
      const { container } = renderWithDirection(<ShebaInput label="شماره شبا" defaultValue={IBAN} />, direction);
      const input = screen.getByLabelText("شماره شبا");
      expect(input).toHaveAttribute("dir", "ltr");
      expect(container.querySelector(".pui-field__control")).toHaveAttribute("dir", "ltr");
      expect(getDirection(input.closest(".pui-field"))).toBe(direction.dir);
      await expectNoA11yViolations(container);
    });
  });
});
