import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ARABIC_DECIMAL_SEPARATOR, arabicIndic, fa, faNumber } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { getDirection } from "../direction";
import { PriceInput, type PriceInputProps } from "./PriceInput";

function setup(props: Partial<PriceInputProps> = {}) {
  const onValueChange = vi.fn();
  const onUnitChange = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <PriceInput label="مبلغ" onValueChange={onValueChange} onUnitChange={onUnitChange} {...props} />,
  );
  const input = screen.getByLabelText("مبلغ") as HTMLInputElement;
  return { ...view, user, input, onValueChange, onUnitChange };
}

describe("PriceInput", () => {
  it("adds thousands separators while typing and reports toman", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, "1500000");
    expect(input).toHaveValue(faNumber("1,500,000"));
    expect(onValueChange).toHaveBeenLastCalledWith(1500000, { rial: 15000000, unit: "toman" });
  });

  it.each([
    ["Persian", fa],
    ["Arabic-Indic", arabicIndic],
    ["Latin", (text: string) => text],
  ])("accepts %s digits", async (_script, convert) => {
    const { user, input, onValueChange } = setup({ digits: "en" });
    await user.type(input, convert("1250000"));
    expect(input).toHaveValue("1,250,000");
    expect(onValueChange).toHaveBeenLastCalledWith(1250000, { rial: 12500000, unit: "toman" });
  });

  it("accepts one decimal in toman, typed as . or ٫", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, "1234.5");
    expect(input).toHaveValue(faNumber("1,234.5"));
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5, { rial: 12345, unit: "toman" });
    await user.clear(input);
    await user.type(input, `12${ARABIC_DECIMAL_SEPARATOR}55`);
    expect(input).toHaveValue(faNumber("12.5"));
  });

  it("drops leading zeros but keeps 0 before a decimal point", async () => {
    const { user, input } = setup({ digits: "en" });
    await user.type(input, "007");
    expect(input).toHaveValue("7");
    await user.clear(input);
    await user.type(input, ".5");
    expect(input).toHaveValue("0.5");
  });

  describe("caret", () => {
    it("stays after the typed digit as separators move", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: 1500000 });
      expect(input).toHaveValue("1,500,000");
      await user.type(input, "2", { initialSelectionStart: 1, initialSelectionEnd: 1 });
      expect(input).toHaveValue("12,500,000");
      expect(input.selectionStart).toBe(2);
    });

    it("deletes the digit before a separator on Backspace", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: 1500000 });
      await user.type(input, "{Backspace}", { initialSelectionStart: 2, initialSelectionEnd: 2 });
      expect(input).toHaveValue("500,000");
      expect(input.selectionStart).toBe(0);
    });

    it("keeps the caret in place when a separator disappears", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: 1500 });
      await user.type(input, "{Backspace}", { initialSelectionStart: 5, initialSelectionEnd: 5 });
      expect(input).toHaveValue("150");
      expect(input.selectionStart).toBe(3);
    });
  });

  describe("unit switch", () => {
    it("shows the same amount in rial without changing the value", async () => {
      const { user, input, onValueChange, onUnitChange } = setup({ digits: "en", defaultValue: 1234.5 });
      await user.click(screen.getByRole("radio", { name: "ریال" }));
      expect(input).toHaveValue("12,345");
      expect(onUnitChange).toHaveBeenCalledWith("rial");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole("radio", { name: "ریال" })).toHaveAttribute("aria-checked", "true");
    });

    it("converts amounts typed in rial to toman, keeping fractions", async () => {
      const { user, input, onValueChange } = setup({ digits: "en", defaultUnit: "rial" });
      await user.type(input, "12345");
      expect(input).toHaveValue("12,345");
      expect(onValueChange).toHaveBeenLastCalledWith(1234.5, { rial: 12345, unit: "rial" });
    });

    it("accepts no decimal point in rial", async () => {
      const { user, input } = setup({ digits: "en", defaultUnit: "rial" });
      await user.type(input, "12.5");
      expect(input).toHaveValue("125");
    });

    it("can be hidden, leaving the unit as a label", () => {
      const { container } = setup({ showUnitToggle: false, defaultUnit: "rial" });
      expect(screen.queryByRole("radiogroup")).toBeNull();
      expect(container.querySelector(".pui-field__affix")).toHaveTextContent("ریال");
    });

    it("follows a controlled unit", () => {
      const { input, rerender } = setup({ digits: "en", defaultValue: 100, unit: "toman" });
      expect(input).toHaveValue("100");
      rerender(<PriceInput label="مبلغ" digits="en" defaultValue={100} unit="rial" />);
      expect(input).toHaveValue("1,000");
    });

    it("ignores a unit change the parent doesn't accept", async () => {
      const { user, input } = setup({ digits: "en", defaultValue: 100, unit: "toman" });
      await user.click(screen.getByRole("radio", { name: "ریال" }));
      expect(input).toHaveValue("100");
      expect(screen.getByRole("radio", { name: "تومان" })).toHaveAttribute("aria-checked", "true");
    });
  });

  it("stays stable when controlled, including half-typed decimals", async () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(null);
      return (
        <>
          <PriceInput label="مبلغ" digits="en" value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue(99)}>
            set
          </button>
          <output>{String(value)}</output>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByLabelText("مبلغ");
    await user.type(input, "12.");
    expect(input).toHaveValue("12.");
    expect(screen.getByRole("status")).toHaveTextContent("12");
    await user.clear(input);
    expect(screen.getByRole("status")).toHaveTextContent("null");
    await user.click(screen.getByRole("button", { name: "set" }));
    expect(input).toHaveValue("99");
  });

  it("submits the amount in toman", () => {
    const { container } = render(
      <form>
        <PriceInput label="مبلغ" name="price" defaultValue={1234.5} />
      </form>,
    );
    expect(new FormData(container.querySelector("form")!).get("price")).toBe("1234.5");
  });

  it("shows an error from outside", () => {
    const { input } = setup({ error: "حداقل مبلغ ۱۰۰۰ تومان است" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("حداقل مبلغ ۱۰۰۰ تومان است");
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("moves between units with the arrow key pointing the reading direction", async () => {
      const user = userEvent.setup();
      const { container } = renderWithDirection(<PriceInput label="مبلغ" defaultValue={1000} />, direction);
      const toman = screen.getByRole("radio", { name: "تومان" });
      const rial = screen.getByRole("radio", { name: "ریال" });
      expect(toman).toHaveAttribute("tabindex", "0");
      expect(rial).toHaveAttribute("tabindex", "-1");

      toman.focus();
      await user.keyboard(direction.dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
      expect(rial).toHaveFocus();
      expect(rial).toHaveAttribute("aria-checked", "true");
      await user.keyboard(direction.dir === "rtl" ? "{ArrowRight}" : "{ArrowLeft}");
      expect(toman).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(rial).toHaveFocus();
      await user.keyboard("{ArrowUp}{Enter}");
      expect(toman).toHaveFocus();

      expect(screen.getByLabelText("مبلغ")).toHaveAttribute("dir", "ltr");
      expect(getDirection(container.querySelector(".pui-field"))).toBe(direction.dir);
      await expectNoA11yViolations(container);
    });
  });
});
