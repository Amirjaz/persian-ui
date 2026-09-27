import { formatJalali } from "@amirjaz/persian-ui/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fa } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import type { DateRange } from "../calendar/PersianRangeCalendar";
import { getDirection } from "../direction";
import { PersianDateRangePicker, type PersianDateRangePickerProps } from "./PersianDateRangePicker";

const dayButton = (iso: string) =>
  screen.getByRole("button", {
    name: (name) => name.startsWith(formatJalali(iso, { format: "long", weekday: true })),
  });
const MESSAGES = {
  required: "تاریخ شروع و پایان را وارد کنید.",
  invalid: "تاریخ معتبر نیست. نمونه: ۱۴۰۴/۰۱/۱۵",
  order: "تاریخ پایان نباید پیش از تاریخ شروع باشد.",
  outOfRange: "این تاریخ خارج از بازهٔ مجاز است.",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2025, 2, 21, 10, 0)); // 1 Farvardin 1404
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(props: Partial<PersianDateRangePickerProps> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<PersianDateRangePicker label="تاریخ سفر" onValueChange={onValueChange} {...props} />);
  const start = screen.getByRole("textbox", { name: "تاریخ سفر از" }) as HTMLInputElement;
  const end = screen.getByRole("textbox", { name: "تاریخ سفر تا" }) as HTMLInputElement;
  const trigger = screen.getByRole("button", { name: "انتخاب بازه از تقویم" });
  return { ...view, user, start, end, trigger, onValueChange };
}

describe("PersianDateRangePicker", () => {
  it("labels the two inputs with the field's label plus «از» and «تا»", async () => {
    const { user, start } = setup();
    await user.click(screen.getByText("تاریخ سفر"));
    expect(start).toHaveFocus();
  });

  it("names the inputs from aria-label, or «از» and «تا» alone, without a label", () => {
    const { unmount } = render(<PersianDateRangePicker aria-label="سفر" />);
    expect(screen.getByRole("textbox", { name: "سفر از" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "سفر تا" })).toBeInTheDocument();
    unmount();
    render(<PersianDateRangePicker />);
    expect(screen.getByRole("textbox", { name: "از" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "تا" })).toBeInTheDocument();
  });

  describe("typing", () => {
    it("reads each date as it is left, in any digit script", async () => {
      const { user, start, end, onValueChange } = setup();
      await user.type(start, fa("1404/01/15"));
      await user.tab();
      expect(onValueChange).toHaveBeenLastCalledWith(
        { start: "2025-04-04", end: null },
        { start: { jalali: { year: 1404, month: 1, day: 15 }, date: new Date(2025, 3, 4) }, end: { jalali: null, date: null } },
      );
      await user.type(end, "14040120{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-04", end: "2025-04-09" }, expect.anything());
      expect(start).toHaveValue(fa("1404/01/15"));
      expect(end).toHaveValue(fa("1404/01/20"));
    });

    it("refuses an end before the start", async () => {
      const { user, end, onValueChange } = setup({ defaultValue: { start: "2025-04-04", end: null } });
      await user.type(end, "1404/01/10");
      await user.tab();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(end).toHaveAttribute("aria-invalid", "true");
      expect(end).toHaveAccessibleDescription(MESSAGES.order);
    });

    it("explains a date it can't read, and keeps it when the other input is committed", async () => {
      const { user, start, end, onValueChange } = setup();
      await user.type(end, "1404/13/01");
      await user.click(start);
      expect(end).toHaveAccessibleDescription(MESSAGES.invalid);
      await user.type(start, "1404/01/01");
      await user.tab();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(end).toHaveValue("1404/13/01");
      expect(end).toHaveAttribute("aria-invalid", "true");
      expect(start).not.toHaveAttribute("aria-invalid");
    });

    it("rejects dates outside min and max", async () => {
      const { user, start } = setup({ min: "2025-03-21", max: "2025-12-31" });
      await user.type(start, "1403/12/29");
      await user.tab();
      expect(start).toHaveAccessibleDescription(MESSAGES.outOfRange);
    });

    it("clears a date when its text is erased", async () => {
      const { user, end, onValueChange } = setup({ defaultValue: { start: "2025-04-04", end: "2025-04-09" } });
      await user.clear(end);
      await user.tab();
      expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-04", end: null }, expect.anything());
    });

    it("asks for both dates when required", async () => {
      const { user, start, end } = setup({ required: true });
      await user.click(start);
      await user.tab();
      expect(start).toHaveAttribute("aria-invalid", "true");
      expect(start).toHaveAccessibleDescription(MESSAGES.required);
      await user.type(start, "1404/01/01");
      await user.click(end);
      await user.tab();
      expect(end).toHaveAttribute("aria-invalid", "true");
      expect(start).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("calendar", () => {
    it("stays open after the start and closes after the end, returning focus", async () => {
      const { user, start, end, trigger, onValueChange } = setup();
      await user.click(trigger);
      expect(screen.getByRole("dialog", { name: "انتخاب بازهٔ تاریخ" })).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      await user.click(dayButton("2025-04-04"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(start).toHaveValue(fa("1404/01/15"));
      expect(end).toHaveValue("");

      await user.click(dayButton("2025-04-09"));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-04", end: "2025-04-09" }, expect.anything());
      expect(end).toHaveValue(fa("1404/01/20"));
      expect(trigger).toHaveFocus();
    });

    it("opens on the start's month with Alt+↓ and closes on Escape", async () => {
      const { user, end, trigger } = setup({ defaultValue: { start: "2025-05-10", end: null } });
      end.focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(screen.getByRole("combobox", { name: "ماه" })).toHaveValue("2");
      expect(dayButton("2025-05-10")).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it("keeps Tab inside the dialog", async () => {
      const { user, trigger } = setup({ defaultValue: { start: "2025-04-04", end: "2025-04-09" } });
      await user.click(trigger);
      const clear = screen.getByRole("button", { name: "پاک کردن" });
      clear.focus();
      await user.tab();
      expect(screen.getByRole("button", { name: "ماه قبل" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(clear).toHaveFocus();
    });

    it("clears both dates with the footer button", async () => {
      const { user, start, trigger, onValueChange } = setup({ defaultValue: { start: "2025-04-04", end: "2025-04-09" } });
      await user.click(trigger);
      await user.click(screen.getByRole("button", { name: "پاک کردن" }));
      expect(onValueChange).toHaveBeenLastCalledWith({ start: null, end: null }, expect.anything());
      expect(start).toHaveValue("");
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("disables Clear when there is nothing to clear, and can hide it", async () => {
      const empty = setup({ defaultOpen: true });
      expect(screen.getByRole("button", { name: "پاک کردن" })).toBeDisabled();
      empty.unmount();
      setup({ defaultOpen: true, showFooter: false });
      expect(screen.queryByRole("button", { name: "پاک کردن" })).toBeNull();
    });

    it("closes on a click outside the field", async () => {
      const { user } = setup({ defaultOpen: true });
      await user.click(document.body);
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("follows a controlled value and submits both dates with their names", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [range, setRange] = useState<DateRange>({ start: "2025-04-04", end: null });
      return (
        <form>
          <PersianDateRangePicker label="سفر" value={range} onValueChange={setRange} startName="from" endName="to" />
          <button type="button" onClick={() => setRange({ start: "2025-04-01", end: "2025-04-02" })}>
            set
          </button>
        </form>
      );
    }
    const { container } = render(<Controlled />);
    const form = container.querySelector("form")!;
    expect(Object.fromEntries(new FormData(form))).toEqual({ from: "2025-04-04", to: "" });
    await user.click(screen.getByRole("button", { name: "set" }));
    expect(screen.getByRole("textbox", { name: "سفر از" })).toHaveValue(fa("1404/01/12"));
    expect(Object.fromEntries(new FormData(form))).toEqual({ from: "2025-04-01", to: "2025-04-02" });
  });

  it("prefers an error passed in, and takes custom messages and labels", async () => {
    const passed = setup({ error: "این بازه پر است." });
    expect(passed.start).toHaveAccessibleDescription("این بازه پر است.");
    passed.unmount();

    const user = userEvent.setup();
    render(
      <PersianDateRangePicker
        label="سفر"
        defaultValue={{ start: "2025-04-04", end: null }}
        messages={{ order: "پایان زودتر از شروع است." }}
        labels={{ from: "شروع", to: "پایان" }}
      />,
    );
    const end = screen.getByRole("textbox", { name: "سفر پایان" });
    await user.type(end, "1404/01/01");
    await user.tab();
    expect(end).toHaveAccessibleDescription("پایان زودتر از شروع است.");
  });

  it("shows placeholders in the chosen digits, and adds class names to each input", () => {
    const persian = setup({ classNames: { startInput: "from", endInput: "to" } });
    expect(persian.start).toHaveAttribute("placeholder", fa("1404/01/15"));
    expect(persian.start).toHaveClass("from");
    expect(persian.end).toHaveClass("to");
    persian.unmount();

    const latin = setup({ digits: "en" });
    expect(latin.end).toHaveAttribute("placeholder", "1404/01/15");
    latin.unmount();

    const custom = setup({ placeholder: "روز/ماه/سال" });
    expect(custom.start).toHaveAttribute("placeholder", "روز/ماه/سال");
  });

  it("can use your own element as the calendar button", async () => {
    const user = userEvent.setup();
    render(
      <PersianDateRangePicker label="سفر" asChild>
        <button type="button" className="mine">
          تقویم
        </button>
      </PersianDateRangePicker>,
    );
    const trigger = screen.getByRole("button", { name: "انتخاب بازه از تقویم" });
    expect(trigger).toHaveClass("mine", "pui-date-picker__trigger");
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("passes axe, closed and open", async () => {
      const user = userEvent.setup();
      const { container } = renderWithDirection(
        <PersianDateRangePicker label="تاریخ سفر" defaultValue={{ start: "2025-04-04", end: "2025-04-09" }} hint="حداکثر یک ماه" />,
        direction,
      );
      await expectNoA11yViolations(container);
      await user.click(screen.getByRole("button", { name: "انتخاب بازه از تقویم" }));
      expect(getDirection(screen.getByRole("dialog"))).toBe(direction.dir);
      await expectNoA11yViolations(container);
    });
  });
});
