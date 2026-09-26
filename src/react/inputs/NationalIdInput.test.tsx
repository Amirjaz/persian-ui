import { validationMessages } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { arabicIndic, fa } from "../../../test/chars";
import { nationalIdFromBody } from "../../../test/generators";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { getDirection } from "../direction";
import { NationalIdInput, type NationalIdInputProps } from "./NationalIdInput";

// Generated from the checksum rule; never a real person's code.
const VALID = nationalIdFromBody("001234567");
const WRONG = VALID.slice(0, 9) + String((Number(VALID[9]) + 1) % 10);
const printed = (id: string) => `${id.slice(0, 3)}-${id.slice(3, 9)}-${id.slice(9)}`;
const messages = validationMessages.nationalId;

function setup(props: Partial<NationalIdInputProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<NationalIdInput label="کد ملی" onValueChange={onValueChange} {...props} />);
  const input = screen.getByLabelText("کد ملی") as HTMLInputElement;
  return { ...view, user, input, onValueChange };
}

describe("NationalIdInput", () => {
  it("formats while typing and reports the value in Latin digits", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, VALID);
    expect(input).toHaveValue(fa(printed(VALID)));
    expect(onValueChange).toHaveBeenLastCalledWith(VALID, { valid: true, value: VALID });
  });

  it.each([
    ["Persian", fa],
    ["Arabic-Indic", arabicIndic],
    ["Latin", (text: string) => text],
  ])("accepts %s digits", async (_script, convert) => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, convert(VALID));
    expect(input).toHaveValue(printed(VALID));
    expect(onValueChange).toHaveBeenLastCalledWith(VALID, { valid: true, value: VALID });
  });

  it("accepts a pasted, formatted code", async () => {
    const { user, input, onValueChange } = setup();
    await user.click(input);
    await user.paste(fa(printed(VALID)));
    expect(onValueChange).toHaveBeenLastCalledWith(VALID, { valid: true, value: VALID });
    expect(input).toHaveValue(fa(printed(VALID)));
  });

  describe("caret", () => {
    it("stays after the digit typed in the middle", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: "001234" });
      expect(input).toHaveValue("001-234");
      await user.type(input, "9", { initialSelectionStart: 2, initialSelectionEnd: 2 });
      expect(input).toHaveValue("009-1234");
      expect(input.selectionStart).toBe(3);
      await user.keyboard("8");
      expect(input).toHaveValue("009-81234");
      expect(input.selectionStart).toBe(5);
    });

    it("deletes the digit before a separator on Backspace", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: "001234" });
      await user.type(input, "{Backspace}", { initialSelectionStart: 4, initialSelectionEnd: 4 });
      expect(input).toHaveValue("002-34");
      expect(input.selectionStart).toBe(2);
    });

    it("deletes the digit after a separator on Delete", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: "001234" });
      await user.type(input, "{Delete}", { initialSelectionStart: 3, initialSelectionEnd: 3 });
      expect(input).toHaveValue("001-34");
      expect(input.selectionStart).toBe(3);
    });

    it("works the same with Persian digits on screen", async () => {
      const { user, input } = setup({ defaultValue: "001234" });
      await user.type(input, "{Backspace}", { initialSelectionStart: 4, initialSelectionEnd: 4 });
      expect(input).toHaveValue(fa("002-34"));
      expect(input.selectionStart).toBe(2);
    });

    it("ignores other characters without moving the caret", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: "001234" });
      await user.type(input, "x", { initialSelectionStart: 2, initialSelectionEnd: 2 });
      expect(input).toHaveValue("001-234");
      expect(input.selectionStart).toBe(2);
    });

    it("ignores typing into a full field instead of pushing digits out", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: VALID });
      await user.type(input, "5", { initialSelectionStart: 1, initialSelectionEnd: 1 });
      expect(input).toHaveValue(printed(VALID));
      expect(input.selectionStart).toBe(1);
    });

    it("cuts a pasted code that is too long", async () => {
      const { user, input, onValueChange } = setup({ digits: "en" });
      await user.click(input);
      await user.paste(`${VALID}99`);
      expect(onValueChange).toHaveBeenLastCalledWith(VALID, { valid: true, value: VALID });
    });

    it("replaces a selection", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: "001234" });
      await user.type(input, "7", { initialSelectionStart: 0, initialSelectionEnd: 7 });
      expect(input).toHaveValue("7");
    });
  });

  describe("errors", () => {
    it("waits for blur before reporting an incomplete code", async () => {
      const { user, input } = setup();
      await user.type(input, "12345");
      expect(input).not.toHaveAttribute("aria-invalid");
      await user.tab();
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(messages.length);
    });

    it("reports a wrong checksum as soon as all ten digits are in", async () => {
      const { user, input } = setup();
      await user.type(input, WRONG);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(messages.checksum);
    });

    it("clears the error once the code is right", async () => {
      const { user, input } = setup({ digits: "en" });
      await user.type(input, WRONG);
      await user.type(input, `{Backspace}${VALID[9]}`);
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(input).not.toHaveAccessibleDescription();
    });

    it("asks for a value when required and left empty", async () => {
      const { user, input } = setup({ required: true });
      await user.click(input);
      await user.tab();
      expect(input).toHaveAccessibleDescription(messages.empty);
    });

    it("says nothing about an empty optional field", async () => {
      const { user, input } = setup();
      await user.click(input);
      await user.tab();
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("uses custom messages", async () => {
      const { user, input } = setup({ messages: { checksum: "کد را دوباره بررسی کنید" } });
      await user.type(input, WRONG);
      expect(input).toHaveAccessibleDescription("کد را دوباره بررسی کنید");
    });

    it("shows an error from outside instead of its own", () => {
      const { input } = setup({ error: "این کد قبلاً ثبت شده است", defaultValue: VALID });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("این کد قبلاً ثبت شده است");
    });
  });

  it("describes the input with the hint, and keeps the caller's description", () => {
    const { input } = setup({ hint: "ده رقم روی کارت ملی", "aria-describedby": "extra" });
    expect(input.getAttribute("aria-describedby")).toMatch(/^extra .+-hint$/);
  });

  it("submits the normalized value with native forms", () => {
    const { container } = render(
      <form>
        <NationalIdInput label="کد ملی" name="nationalId" defaultValue={VALID} />
      </form>,
    );
    expect(new FormData(container.querySelector("form")!).get("nationalId")).toBe(VALID);
    expect(screen.getByLabelText("کد ملی")).not.toHaveAttribute("name");
  });

  it("can be controlled", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <NationalIdInput label="کد ملی" digits="en" value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue(VALID)}>
            fill
          </button>
          <output>{value}</output>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    await user.type(screen.getByLabelText("کد ملی"), fa("123"));
    expect(screen.getByRole("status")).toHaveTextContent("123");
    await user.click(screen.getByRole("button", { name: "fill" }));
    expect(screen.getByLabelText("کد ملی")).toHaveValue(printed(VALID));
  });

  it("forwards the ref, passes props through and asks for a numeric keyboard", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NationalIdInput label="کد ملی" ref={ref} placeholder="کد ملی" className="custom" />);
    const input = screen.getByLabelText("کد ملی");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("placeholder", "کد ملی");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input.closest(".pui-field")).toHaveClass("pui-national-id-input", "custom");
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("keeps the digits left to right inside a field that follows the direction", async () => {
      const { container } = renderWithDirection(
        <NationalIdInput label="کد ملی" defaultValue={VALID} hint="ده رقم" />,
        direction,
      );
      const input = screen.getByLabelText("کد ملی");
      expect(input).toHaveAttribute("dir", "ltr");
      expect(getDirection(input.closest(".pui-field"))).toBe(direction.dir);
      await expectNoA11yViolations(container);
    });
  });
});
