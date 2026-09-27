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
const RESULT = { valid: true, value: IBAN, bank: { id: "mellat", name: "بانک ملت" } };
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
    expect(onValueChange).toHaveBeenLastCalledWith(IBAN, RESULT);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("accepts a pasted IBAN with spaces and Persian digits", async () => {
    const { user, input, onValueChange } = setup();
    await user.click(input);
    await user.paste(`IR${fa(grouped(DIGITS))}`);
    expect(onValueChange).toHaveBeenLastCalledWith(IBAN, RESULT);
    expect(input).toHaveValue(fa(grouped(DIGITS)));
  });

  it("reports a wrong checksum once all 24 digits are in", async () => {
    const { user, input } = setup();
    const wrong = DIGITS.slice(0, 23) + String((Number(DIGITS[23]) + 1) % 10);
    await user.type(input, wrong);
    // The bank (from the code after the check digits) is described first, then the error.
    expect(input).toHaveAccessibleDescription(`بانک ملت ${validationMessages.sheba.checksum}`);
  });

  describe("bank", () => {
    it("names the bank at the end of the field once its code is typed", async () => {
      const { user, input, container } = setup({ digits: "en" });
      await user.type(input, DIGITS.slice(0, 4));
      expect(container.querySelector(".pui-field__bank")).toBeNull();
      await user.type(input, DIGITS.slice(4, 5));
      const bank = container.querySelector(".pui-field__bank")!;
      expect(bank).toHaveTextContent("بانک ملت");
      expect(container.querySelector(".pui-field__control")!.lastElementChild).toBe(bank);
      expect(container.querySelector(".pui-field")).toHaveAttribute("data-bank", "mellat");
      expect(input).toHaveAccessibleDescription("بانک ملت");
    });

    it("names the current bank for accounts of a merged bank", () => {
      const { container } = setup({ defaultValue: shebaFromBban("0630000000000000000123") });
      expect(container.querySelector(".pui-field__bank")).toHaveTextContent("بانک سپه");
      expect(container.querySelector(".pui-field")).toHaveAttribute("data-bank", "sepah");
    });

    it("shows nothing for unknown codes or with showBank={false}", () => {
      const unknown = setup({ defaultValue: shebaFromBban("0990000000000000000123") });
      expect(unknown.container.querySelector(".pui-field__bank")).toBeNull();
      expect(unknown.container.querySelector(".pui-field")).not.toHaveAttribute("data-bank");
      unknown.unmount();

      const hidden = setup({ defaultValue: IBAN, showBank: false });
      expect(hidden.container.querySelector(".pui-field__bank")).toBeNull();
      expect(hidden.container.querySelector(".pui-field")).not.toHaveAttribute("data-bank");
    });
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
