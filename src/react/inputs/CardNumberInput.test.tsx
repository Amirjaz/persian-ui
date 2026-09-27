import { validationMessages } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { arabicIndic, fa } from "../../../test/chars";
import { cardNumberFromBody } from "../../../test/generators";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { getDirection } from "../direction";
import { CardNumberInput, type CardNumberInputProps } from "./CardNumberInput";

// Generated from the Luhn rule on a Melli prefix; not a real card.
const CARD = cardNumberFromBody("603799000012345");
const WRONG = CARD.slice(0, 15) + String((Number(CARD[15]) + 1) % 10);
const MELLI = { id: "melli", name: "بانک ملی ایران" };
const grouped = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, "$1 ");
const messages = validationMessages.card;

function setup(props: Partial<CardNumberInputProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<CardNumberInput label="شماره کارت" onValueChange={onValueChange} {...props} />);
  const input = screen.getByLabelText("شماره کارت") as HTMLInputElement;
  const bank = () => view.container.querySelector(".pui-field__bank");
  const root = () => view.container.querySelector(".pui-field")!;
  return { ...view, user, input, bank, root, onValueChange };
}

describe("CardNumberInput", () => {
  it("groups the digits in fours and reports the number and its bank", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, CARD);
    expect(input).toHaveValue(fa(grouped(CARD)));
    expect(onValueChange).toHaveBeenLastCalledWith(CARD, { valid: true, value: CARD, bank: MELLI });
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it.each([
    ["Persian", fa],
    ["Arabic-Indic", arabicIndic],
    ["Latin", (text: string) => text],
  ])("accepts %s digits", async (_script, convert) => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, convert(CARD));
    expect(input).toHaveValue(grouped(CARD));
    expect(onValueChange).toHaveBeenLastCalledWith(CARD, expect.objectContaining({ valid: true }));
  });

  it("accepts a pasted number with spaces or dashes and cuts extra digits", async () => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.click(input);
    await user.paste(`${grouped(CARD).replace(/ /g, "-")}99`);
    expect(input).toHaveValue(grouped(CARD));
    expect(onValueChange).toHaveBeenLastCalledWith(CARD, expect.objectContaining({ valid: true }));
  });

  it("submits the 16 digits and suggests the browser's card autofill", () => {
    const { input, container } = setup({ defaultValue: CARD, name: "card" });
    expect(input).toHaveAttribute("autocomplete", "cc-number");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe(CARD);
  });

  describe("bank", () => {
    it("appears as soon as the first six digits are in", async () => {
      const { user, input, bank, root } = setup();
      await user.type(input, "60379");
      expect(bank()).toBeNull();
      expect(root()).not.toHaveAttribute("data-bank");
      await user.type(input, "9");
      expect(bank()).toHaveTextContent("بانک ملی ایران");
      expect(root()).toHaveAttribute("data-bank", "melli");
      expect(input).toHaveAccessibleDescription("بانک ملی ایران");
    });

    it("names the bank that serves cards of a merged bank", () => {
      const { bank, root } = setup({ defaultValue: cardNumberFromBody("627381000012345") });
      expect(bank()).toHaveTextContent("بانک سپه");
      expect(root()).toHaveAttribute("data-bank", "sepah");
    });

    it("shows nothing for an unknown prefix, or with showBank={false}", () => {
      const unknown = setup({ defaultValue: cardNumberFromBody("400000123456789") });
      expect(unknown.bank()).toBeNull();
      unknown.unmount();
      const hidden = setup({ defaultValue: CARD, showBank: false });
      expect(hidden.bank()).toBeNull();
      expect(hidden.root()).not.toHaveAttribute("data-bank");
    });
  });

  describe("errors", () => {
    it("reports a wrong checksum once all 16 digits are in", async () => {
      const { user, input, onValueChange } = setup();
      await user.type(input, WRONG);
      expect(onValueChange).toHaveBeenLastCalledWith(WRONG, { valid: false, reason: "checksum" });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(`بانک ملی ایران ${messages.checksum}`);
    });

    it("waits for blur before reporting a short number", async () => {
      const { user, input } = setup();
      await user.type(input, "6037");
      expect(input).not.toHaveAttribute("aria-invalid");
      await user.tab();
      expect(input).toHaveAccessibleDescription(messages.length);
    });

    it("prefers an error passed in, and custom messages", async () => {
      const passed = setup({ error: "این کارت مسدود است." });
      expect(passed.input).toHaveAccessibleDescription("این کارت مسدود است.");
      passed.unmount();

      const custom = setup({ messages: { checksum: "شماره را دوباره بررسی کنید." }, showBank: false });
      await custom.user.type(custom.input, WRONG);
      expect(custom.input).toHaveAccessibleDescription("شماره را دوباره بررسی کنید.");
    });
  });

  it("forwards the ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<CardNumberInput ref={ref} aria-label="کارت" />);
    expect(ref.current).toBe(screen.getByLabelText("کارت"));
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("keeps the digits left to right and the bank at the end of the field", async () => {
      const { container } = renderWithDirection(<CardNumberInput label="شماره کارت" defaultValue={CARD} />, direction);
      const input = screen.getByLabelText("شماره کارت");
      expect(input).toHaveAttribute("dir", "ltr");
      expect(getDirection(input.closest(".pui-field"))).toBe(direction.dir);
      const control = container.querySelector(".pui-field__control")!;
      expect(control.lastElementChild).toHaveClass("pui-field__bank");
      await expectNoA11yViolations(container);
    });
  });
});
