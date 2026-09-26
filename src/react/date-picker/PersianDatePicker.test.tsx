import { formatJalali } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { arabicIndic, fa } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { PersianDatePicker, type PersianDatePickerProps } from "./PersianDatePicker";

const dayButton = (iso: string) =>
  screen.getByRole("button", {
    name: (name) => name.startsWith(formatJalali(iso, { format: "long", weekday: true })),
  });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2025, 2, 21, 10, 0)); // 1 Farvardin 1404
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(props: Partial<PersianDatePickerProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<PersianDatePicker label="تاریخ تولد" onValueChange={onValueChange} {...props} />);
  const input = screen.getByLabelText("تاریخ تولد") as HTMLInputElement;
  const trigger = screen.getByRole("button", { name: "انتخاب تاریخ از تقویم" });
  return { ...view, user, input, trigger, onValueChange };
}

describe("PersianDatePicker", () => {
  describe("typing a date", () => {
    it.each([
      ["with Persian digits", fa("1404/01/15")],
      ["with Latin digits", "1404/1/15"],
      ["with Arabic-Indic digits and dots", arabicIndic("1404.01.15")],
      ["without separators", "14040115"],
    ])("reads it %s", async (_how, typed) => {
      const { user, input, onValueChange } = setup();
      await user.type(input, typed);
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith("2025-04-04", {
        jalali: { year: 1404, month: 1, day: 15 },
        date: new Date(2025, 3, 4),
      });
      expect(input).toHaveValue(fa("1404/01/15"));
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("commits on Enter", async () => {
      const { user, input, onValueChange } = setup();
      await user.type(input, "1404/01/15{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("2025-04-04", expect.anything());
    });

    it("explains a date it can't read, until the text changes", async () => {
      const { user, input, onValueChange } = setup();
      await user.type(input, "1404/12/30");
      await user.tab();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("تاریخ معتبر نیست. نمونه: ۱۴۰۴/۰۱/۱۵");
      await user.type(input, "{Backspace}");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("rejects dates outside min and max, and disabled dates", async () => {
      const { user, input } = setup({
        min: "2025-03-21",
        max: "2025-12-31",
        isDateDisabled: (iso) => iso === "2025-04-04",
      });
      await user.type(input, "1403/12/29");
      await user.tab();
      expect(input).toHaveAccessibleDescription("این تاریخ خارج از بازهٔ مجاز است.");
      await user.clear(input);
      await user.type(input, "1405/01/01");
      await user.tab();
      expect(input).toHaveAccessibleDescription("این تاریخ خارج از بازهٔ مجاز است.");
      await user.clear(input);
      await user.type(input, "1404/01/15");
      await user.tab();
      expect(input).toHaveAccessibleDescription("این تاریخ قابل انتخاب نیست.");
    });

    it("clears the value when the text is cleared", async () => {
      const { user, input, onValueChange } = setup({ defaultValue: "2025-04-04" });
      expect(input).toHaveValue(fa("1404/01/15"));
      await user.clear(input);
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith(null, { jalali: null, date: null });
    });

    it("asks for a date when required", async () => {
      const { user, input } = setup({ required: true });
      await user.click(input);
      await user.tab();
      expect(input).toHaveAccessibleDescription("تاریخ را وارد کنید.");
    });

    it("uses custom messages and outside errors", async () => {
      const { user, input, rerender } = setup({ messages: { invalid: "تاریخ اشتباه است" } });
      await user.type(input, "abc");
      await user.tab();
      expect(input).toHaveAccessibleDescription("تاریخ اشتباه است");
      rerender(<PersianDatePicker label="تاریخ تولد" error="تاریخ را از سرور بررسی کنید" />);
      expect(input).toHaveAccessibleDescription("تاریخ را از سرور بررسی کنید");
    });
  });

  describe("calendar dialog", () => {
    it("opens as a modal dialog with focus on the selected day", async () => {
      const { user, trigger } = setup({ defaultValue: "2025-04-04" });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.click(trigger);
      const dialog = screen.getByRole("dialog", { name: "انتخاب تاریخ" });
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", dialog.id);
      expect(dayButton("2025-04-04")).toHaveFocus();
    });

    it("closes on Escape and returns focus to the button", async () => {
      const { user, trigger } = setup();
      await user.click(trigger);
      expect(dayButton("2025-03-21")).toHaveFocus(); // today
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it("sets the date when a day is picked, then closes", async () => {
      const { user, input, trigger, onValueChange } = setup();
      await user.click(trigger);
      await user.click(dayButton("2025-04-04"));
      expect(onValueChange).toHaveBeenCalledWith("2025-04-04", expect.anything());
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(input).toHaveValue(fa("1404/01/15"));
      expect(trigger).toHaveFocus();
    });

    it("traps focus inside the dialog", async () => {
      const { user, trigger } = setup({ defaultValue: "2025-04-04" });
      await user.click(trigger);
      const previousMonth = screen.getByRole("button", { name: "ماه قبل" });
      const clear = screen.getByRole("button", { name: "پاک کردن" });
      clear.focus();
      await user.tab();
      expect(previousMonth).toHaveFocus();
      await user.tab({ shift: true });
      expect(clear).toHaveFocus();
      // Between the first and last control, Tab moves normally.
      previousMonth.focus();
      await user.tab();
      expect(screen.getByRole("combobox", { name: "ماه" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(previousMonth).toHaveFocus();
    });

    it("opens from the text field with Alt+ArrowDown", async () => {
      const { user, input } = setup();
      await user.click(input);
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes when the user clicks elsewhere", async () => {
      const { user, trigger } = setup();
      await user.click(trigger);
      await user.click(document.body);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("has Today and Clear buttons", async () => {
      const { user, trigger, onValueChange } = setup({ defaultValue: "2025-04-04" });
      await user.click(trigger);
      await user.click(screen.getByRole("button", { name: "امروز" }));
      expect(onValueChange).toHaveBeenLastCalledWith("2025-03-21", expect.anything());
      await user.click(trigger);
      await user.click(screen.getByRole("button", { name: "پاک کردن" }));
      expect(onValueChange).toHaveBeenLastCalledWith(null, { jalali: null, date: null });
    });

    it("disables Today when today can't be picked, and Clear when there is nothing to clear", async () => {
      const { user, trigger } = setup({ min: "2025-04-01" });
      await user.click(trigger);
      expect(screen.getByRole("button", { name: "امروز" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "پاک کردن" })).toBeDisabled();
    });

    it("can hide the footer", async () => {
      const { user, trigger } = setup({ showFooter: false });
      await user.click(trigger);
      expect(screen.queryByRole("button", { name: "امروز" })).toBeNull();
    });

    it("can have its open state controlled", async () => {
      const onOpenChange = vi.fn();
      const { user } = setup({ open: true, onOpenChange });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await user.click(document.body);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens below the field unless there is no room", async () => {
      const { user, trigger } = setup();
      await user.click(trigger);
      expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "bottom");
    });
  });

  it("uses a custom trigger with asChild", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <PersianDatePicker label="تاریخ" asChild>
        <button type="button" className="mine" onClick={onClick}>
          تقویم
        </button>
      </PersianDatePicker>,
    );
    const trigger = screen.getByRole("button", { name: "انتخاب تاریخ از تقویم" });
    expect(trigger).toHaveTextContent("تقویم");
    expect(trigger).toHaveClass("mine", "pui-date-picker__trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(trigger);
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("submits the ISO date with native forms and follows a controlled value", () => {
    const { container, rerender } = render(
      <form>
        <PersianDatePicker label="تاریخ" name="date" value="2025-04-04" />
      </form>,
    );
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("date")).toBe("2025-04-04");
    rerender(
      <form>
        <PersianDatePicker label="تاریخ" name="date" value="2025-05-01" />
      </form>,
    );
    expect(screen.getByLabelText("تاریخ")).toHaveValue(fa("1404/02/11"));
    expect(new FormData(form).get("date")).toBe("2025-05-01");
  });

  it("uses Latin digits on request", () => {
    render(<PersianDatePicker label="تاریخ" digits="en" defaultValue="2025-04-04" />);
    const input = screen.getByLabelText("تاریخ");
    expect(input).toHaveValue("1404/01/15");
    expect(input).toHaveAttribute("placeholder", "1404/01/15");
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("keeps the date left to right and the calendar keys following the direction", async () => {
      const user = userEvent.setup();
      const { container } = renderWithDirection(
        <PersianDatePicker label="تاریخ" defaultValue="2025-04-04" />,
        direction,
      );
      expect(screen.getByLabelText("تاریخ")).toHaveAttribute("dir", "ltr");
      await expectNoA11yViolations(container);

      await user.click(screen.getByRole("button", { name: "انتخاب تاریخ از تقویم" }));
      await user.keyboard(direction.dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
      expect(dayButton("2025-04-05")).toHaveFocus();
      await expectNoA11yViolations(container);
    });
  });
});
