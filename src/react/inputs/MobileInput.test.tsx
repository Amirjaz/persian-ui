import { validationMessages } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { arabicIndic, fa } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { getDirection } from "../direction";
import { MobileInput, type MobileInputProps } from "./MobileInput";

const NUMBER = "09121234567";
const RESULT = { valid: true, value: NUMBER, e164: "+989121234567", operator: "MCI" };

function setup(props: Partial<MobileInputProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  render(<MobileInput label="شماره موبایل" onValueChange={onValueChange} {...props} />);
  const input = screen.getByLabelText("شماره موبایل") as HTMLInputElement;
  return { user, input, onValueChange };
}

describe("MobileInput", () => {
  it("formats while typing and reports the number with its operator", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, NUMBER);
    expect(input).toHaveValue(fa("0912 123 4567"));
    expect(onValueChange).toHaveBeenLastCalledWith(NUMBER, RESULT);
  });

  it.each([
    ["Persian", fa],
    ["Arabic-Indic", arabicIndic],
  ])("accepts %s digits", async (_script, convert) => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, convert(NUMBER));
    expect(input).toHaveValue("0912 123 4567");
    expect(onValueChange).toHaveBeenLastCalledWith(NUMBER, RESULT);
  });

  it.each(["+98 912 123 4567", "0098 912 123 4567", "+98 0912 123 4567", fa("+989121234567")])(
    "turns a pasted %s into the national form",
    async (pasted) => {
      const { user, input, onValueChange } = setup({ digits: "en" });
      await user.click(input);
      await user.paste(pasted);
      expect(onValueChange).toHaveBeenLastCalledWith(NUMBER, RESULT);
      expect(input).toHaveValue("0912 123 4567");
    },
  );

  it("converts an international number typed digit by digit", async () => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, "+989121234567");
    expect(onValueChange).toHaveBeenLastCalledWith(NUMBER, RESULT);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("doesn't complain while an international prefix is still being typed", async () => {
    const { user, input } = setup();
    await user.type(input, "00989121234");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("rejects a complete landline number right away", async () => {
    const { user, input } = setup();
    await user.type(input, "02188776655");
    expect(input).toHaveAccessibleDescription(validationMessages.mobile.notMobile);
  });

  it("uses the phone keyboard and autofill", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("autocomplete", "tel");
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("keeps the digit groups left to right", async () => {
      const { container } = renderWithDirection(
        <MobileInput label="شماره موبایل" defaultValue={NUMBER} digits="en" />,
        direction,
      );
      const input = screen.getByLabelText("شماره موبایل");
      expect(input).toHaveAttribute("dir", "ltr");
      expect(input).toHaveValue("0912 123 4567");
      expect(getDirection(input.closest(".pui-field"))).toBe(direction.dir);
      await expectNoA11yViolations(container);
    });
  });
});
