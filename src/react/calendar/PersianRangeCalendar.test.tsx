import { formatJalali } from "@amirjaz/persian-ui/core";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { PersianRangeCalendar, type DateRange } from "./PersianRangeCalendar";

const dayName = (iso: string) => formatJalali(iso, { format: "long", weekday: true });
const day = (iso: string) => screen.getByRole("button", { name: (name) => name.startsWith(dayName(iso)) });
const cell = (iso: string) => day(iso).closest("td")!;
const isos = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `2025-04-${String(from + index).padStart(2, "0")}`);
const RANGE: DateRange = { start: "2025-04-05", end: "2025-04-09" };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2025, 2, 21, 10, 0)); // 1 Farvardin 1404
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(props: Partial<Parameters<typeof PersianRangeCalendar>[0]> = {}) {
  const onValueChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<PersianRangeCalendar onValueChange={onValueChange} {...props} />);
  return { ...view, user, onValueChange };
}

describe("PersianRangeCalendar", () => {
  it("marks the start, the end and the days between", () => {
    setup({ defaultValue: RANGE });
    expect(day("2025-04-05")).toHaveAttribute("data-range-start");
    expect(day("2025-04-05")).toHaveAttribute("data-selected");
    expect(day("2025-04-09")).toHaveAttribute("data-range-end");
    expect(day("2025-04-09")).toHaveAttribute("data-selected");
    for (const iso of isos(6, 8)) {
      expect(day(iso)).toHaveAttribute("data-in-range");
      expect(day(iso)).not.toHaveAttribute("data-selected");
    }
    for (const iso of isos(5, 9)) expect(cell(iso)).toHaveAttribute("aria-selected", "true");
    expect(cell("2025-04-04")).toHaveAttribute("aria-selected", "false");
    expect(cell("2025-04-10")).toHaveAttribute("aria-selected", "false");
    expect(day("2025-04-05")).toHaveAccessibleName(`${dayName("2025-04-05")}، آغاز بازه`);
    expect(day("2025-04-09")).toHaveAccessibleName(`${dayName("2025-04-09")}، پایان بازه`);
  });

  it("opens on the start's month and puts it in the tab order", () => {
    setup({ defaultValue: { start: "2025-05-10", end: "2025-06-02" } });
    expect(screen.getByRole("combobox", { name: "ماه" })).toHaveValue("2");
    expect(day("2025-05-10")).toHaveAttribute("tabindex", "0");
  });

  it("picks the start, then the end, and reports both in three forms", async () => {
    const { user, onValueChange } = setup();
    await user.click(day("2025-04-05"));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: "2025-04-05", end: null },
      {
        start: { jalali: { year: 1404, month: 1, day: 16 }, date: new Date(2025, 3, 5) },
        end: { jalali: null, date: null },
      },
    );
    expect(screen.getByText("تاریخ پایان را انتخاب کنید.")).toHaveClass("pui-sr-only");

    await user.click(day("2025-04-09"));
    expect(onValueChange).toHaveBeenLastCalledWith(RANGE, expect.objectContaining({
      end: { jalali: { year: 1404, month: 1, day: 20 }, date: new Date(2025, 3, 9) },
    }));
    expect(screen.queryByText("تاریخ پایان را انتخاب کنید.")).toBeNull();
    expect(day("2025-04-07")).toHaveAttribute("data-in-range");
  });

  it("starts over from a day before the start, and after a finished range", async () => {
    const { user, onValueChange } = setup({ defaultValue: { start: "2025-04-10", end: null } });
    await user.click(day("2025-04-05"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-05", end: null }, expect.anything());
    await user.click(day("2025-04-09"));
    await user.click(day("2025-04-20"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-20", end: null }, expect.anything());
  });

  it("allows a one-day range", async () => {
    const { user, onValueChange } = setup();
    await user.click(day("2025-04-05"));
    await user.click(day("2025-04-05"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-05", end: "2025-04-05" }, expect.anything());
    expect(day("2025-04-05")).toHaveAccessibleName(`${dayName("2025-04-05")}، آغاز بازه، پایان بازه`);
  });

  describe("preview", () => {
    it("fills the days up to the hovered one until the end is picked", async () => {
      const { user } = setup({ defaultValue: { start: "2025-04-05", end: null } });
      await user.hover(day("2025-04-08"));
      for (const iso of isos(6, 8)) expect(day(iso)).toHaveAttribute("data-range-preview");
      expect(day("2025-04-09")).not.toHaveAttribute("data-range-preview");
      // A preview isn't a selection.
      expect(cell("2025-04-07")).toHaveAttribute("aria-selected", "false");

      fireEvent.mouseLeave(screen.getByRole("grid"));
      expect(day("2025-04-06")).not.toHaveAttribute("data-range-preview");
    });

    it("follows keyboard focus too", async () => {
      const { user } = setup({ defaultValue: { start: "2025-04-05", end: null }, dir: "ltr" });
      day("2025-04-05").focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(day("2025-04-07")).toHaveFocus();
      expect(day("2025-04-06")).toHaveAttribute("data-range-preview");
      expect(day("2025-04-07")).toHaveAttribute("data-range-preview");
      await user.keyboard("{Enter}");
      expect(day("2025-04-07")).toHaveAttribute("data-range-end");
    });

    it("shows nothing before the start or once the range is complete", async () => {
      const early = setup({ defaultValue: { start: "2025-04-05", end: null } });
      await early.user.hover(day("2025-04-02"));
      expect(document.querySelector("[data-range-preview]")).toBeNull();
      early.unmount();

      const done = setup({ defaultValue: RANGE });
      await done.user.hover(day("2025-04-15"));
      expect(document.querySelector("[data-range-preview]")).toBeNull();
    });
  });

  it("never picks a disabled day, but a range may span one", async () => {
    const isFriday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 5;
    const { user, onValueChange } = setup({ isDateDisabled: isFriday, min: "2025-04-02" });
    await user.click(day("2025-04-04")); // a Friday
    await user.click(day("2025-04-01")); // before min
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(day("2025-04-03"));
    await user.click(day("2025-04-05"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2025-04-03", end: "2025-04-05" }, expect.anything());
    expect(day("2025-04-04")).toHaveAttribute("data-in-range");
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [range, setRange] = useState<DateRange>({ start: null, end: null });
      return (
        <>
          <PersianRangeCalendar value={range} onValueChange={setRange} />
          <output>{`${range.start} ${range.end}`}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(day("2025-04-05"));
    await user.click(day("2025-04-09"));
    expect(screen.getByRole("status")).toHaveTextContent("2025-04-05 2025-04-09");
    expect(day("2025-04-07")).toHaveAttribute("data-in-range");
  });

  it("adds class names to the range's days", () => {
    setup({
      defaultValue: RANGE,
      classNames: { dayRangeStart: "start", dayInRange: "between", dayRangeEnd: "end", daySelected: "picked" },
    });
    expect(day("2025-04-05")).toHaveClass("start", "picked");
    expect(day("2025-04-06")).toHaveClass("between");
    expect(day("2025-04-06")).not.toHaveClass("picked");
    expect(day("2025-04-09")).toHaveClass("end", "picked");
  });

  it("takes custom labels", async () => {
    const { user } = setup({
      defaultValue: { start: "2025-04-05", end: null },
      labels: { rangeStart: "شروع", selectEnd: "حالا روز پایان را بزنید." },
    });
    expect(day("2025-04-05")).toHaveAccessibleName(`${dayName("2025-04-05")}، شروع`);
    expect(screen.getByText("حالا روز پایان را بزنید.")).toBeInTheDocument();
    await user.click(day("2025-04-06"));
    expect(screen.queryByText("حالا روز پایان را بزنید.")).toBeNull();
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (direction) => {
    it("moves by day in the reading direction and passes axe", async () => {
      const user = userEvent.setup();
      const { container } = renderWithDirection(<PersianRangeCalendar defaultValue={RANGE} />, direction);
      day("2025-04-07").focus();
      await user.keyboard("{ArrowLeft}");
      expect(day(direction.dir === "rtl" ? "2025-04-08" : "2025-04-06")).toHaveFocus();
      await expectNoA11yViolations(container);
    });
  });
});
