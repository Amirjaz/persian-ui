import { formatJalali } from "@amirjaz/persian-ui/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fa } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { DirectionProvider } from "../direction";
import { PersianCalendar } from "./PersianCalendar";

/** The accessible name of a day button (the holiday, if any, is appended). */
const dayName = (iso: string, digits: "fa" | "en" = "fa") =>
  formatJalali(iso, { format: "long", weekday: true, digits });
const day = (iso: string, digits: "fa" | "en" = "fa") =>
  screen.getByRole("button", { name: (name) => name.startsWith(dayName(iso, digits)) });
const heading = (month: string, year: string) => `${month} ${fa(year)}`;

beforeEach(() => {
  // "Today" is 1 Farvardin 1404.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2025, 2, 21, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PersianCalendar", () => {
  it("shows six weeks of the selected day's month, Saturday first", () => {
    render(<PersianCalendar defaultValue="2025-04-04" />);
    const grid = screen.getByRole("grid", { name: heading("فروردین", "1404") });
    expect(within(grid).getAllByRole("button")).toHaveLength(42);
    const headers = within(grid).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual(
      ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"].map(
        (name) => `${name.charAt(0)}${name}`,
      ),
    );
    expect(day("2025-04-04").closest("td")).toHaveAttribute("aria-selected", "true");
    expect(day("2025-04-05").closest("td")).toHaveAttribute("aria-selected", "false");
  });

  it("starts the week on Sunday when asked", () => {
    render(<PersianCalendar weekStartsOn={0} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("یک‌شنبه");
  });

  it("selects a clicked day and reports it in three forms", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PersianCalendar onValueChange={onValueChange} />);
    await user.click(day("2025-04-04"));
    expect(onValueChange).toHaveBeenCalledWith("2025-04-04", {
      jalali: { year: 1404, month: 1, day: 15 },
      date: new Date(2025, 3, 4),
    });
    expect(day("2025-04-04").closest("td")).toHaveAttribute("aria-selected", "true");
  });

  it("marks today, Fridays and holidays", () => {
    render(<PersianCalendar />);
    const nowruz = day("2025-03-21");
    expect(nowruz).toHaveAttribute("aria-current", "date");
    expect(nowruz).toHaveAttribute("data-weekend");
    expect(nowruz).toHaveAttribute("data-holiday");
    expect(nowruz).toHaveAccessibleName(`${dayName("2025-03-21")}، تعطیل: نوروز`);
    expect(day("2025-03-26")).not.toHaveAttribute("data-holiday");
  });

  it("places lunar holidays on the tabular Hijri date (ICU islamic-civil)", () => {
    const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-civil", { timeZone: "UTC", month: "numeric", day: "numeric" });
    let eid = "";
    for (let ms = Date.UTC(2025, 2, 21); !eid; ms += 86_400_000) {
      const parts = Object.fromEntries(hijri.formatToParts(ms).map((part) => [part.type, part.value]));
      if (parts.month === "10" && parts.day === "1") eid = new Date(ms).toISOString().slice(0, 10);
    }
    render(<PersianCalendar defaultValue={eid} />);
    expect(day(eid)).toHaveAccessibleName(`${dayName(eid)}، تعطیل: عید فطر`);
  });

  it("can hide holidays", () => {
    render(<PersianCalendar showHolidays={false} />);
    expect(day("2025-03-21")).not.toHaveAttribute("data-holiday");
    expect(day("2025-03-21")).toHaveAccessibleName(dayName("2025-03-21"));
  });

  it("can show the Gregorian calendar alongside", () => {
    const { container } = render(<PersianCalendar showGregorian />);
    expect(container.querySelector(".pui-calendar__gregorian-range")).toHaveTextContent("مارس – آوریل ۲۰۲۵");
    expect(within(day("2025-03-21")).getByText(fa("21"))).toHaveClass("pui-calendar__gregorian");
  });

  it("names the months across a Gregorian new year", () => {
    const { container } = render(<PersianCalendar showGregorian digits="en" defaultMonth={{ year: 1403, month: 10 }} />);
    expect(container.querySelector(".pui-calendar__gregorian-range")).toHaveTextContent("دسامبر 2024 – ژانویه 2025");
  });

  it("uses Latin digits on request", () => {
    render(<PersianCalendar digits="en" />);
    expect(screen.getByRole("grid", { name: "فروردین 1404" })).toBeInTheDocument();
    expect(day("2025-03-21", "en")).toHaveTextContent("1");
  });

  it("moves between months with the buttons and announces the new month", async () => {
    const user = userEvent.setup();
    const { container } = render(<PersianCalendar />);
    const live = container.querySelector("[aria-live]")!;
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    expect(live).toHaveTextContent(heading("اردیبهشت", "1404"));
    expect(screen.getByRole("grid")).toHaveAccessibleName(heading("اردیبهشت", "1404"));
    await user.click(screen.getByRole("button", { name: "ماه قبل" }));
    await user.click(screen.getByRole("button", { name: "ماه قبل" }));
    expect(live).toHaveTextContent(heading("اسفند", "1403"));
  });

  it("jumps with the month and year lists", async () => {
    const user = userEvent.setup();
    render(<PersianCalendar yearRange={{ back: 2, forward: 1 }} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "ماه" }), "7");
    expect(screen.getByRole("grid")).toHaveAccessibleName(heading("مهر", "1404"));
    const years = screen.getByRole("combobox", { name: "سال" });
    expect(within(years).getAllByRole("option").map((option) => option.textContent)).toEqual(
      ["1402", "1403", "1404", "1405"].map(fa),
    );
    await user.selectOptions(years, "1402");
    expect(screen.getByRole("grid")).toHaveAccessibleName(heading("مهر", "1402"));
  });

  it("keeps days outside min and max unselectable", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PersianCalendar min="2025-03-25" max="2025-04-10" onValueChange={onValueChange} />);
    expect(day("2025-03-24")).toHaveAttribute("aria-disabled", "true");
    expect(day("2025-04-11")).toHaveAttribute("aria-disabled", "true");
    await user.click(day("2025-03-24"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ماه قبل" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ماه بعد" })).toBeDisabled();
    const months = screen.getByRole("combobox", { name: "ماه" });
    expect(within(months).getByRole("option", { name: "اردیبهشت" })).toBeDisabled();
    expect(within(screen.getByRole("combobox", { name: "سال" })).getAllByRole("option")).toHaveLength(1);
  });

  it("stops keyboard focus at min and max", async () => {
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <PersianCalendar min="2025-03-25" max="2025-04-10" defaultValue="2025-03-27" />
      </DirectionProvider>,
    );
    day("2025-03-27").focus();
    await user.keyboard("{ArrowUp}");
    expect(day("2025-03-25")).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(day("2025-04-10")).toHaveFocus();
  });

  it("lets the app disable any day", () => {
    render(<PersianCalendar isDateDisabled={(iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 5} />);
    expect(day("2025-03-21")).toHaveAttribute("aria-disabled", "true");
    expect(day("2025-03-22")).not.toHaveAttribute("aria-disabled");
  });

  it("can have its month controlled", async () => {
    const onMonthChange = vi.fn();
    const user = userEvent.setup();
    render(<PersianCalendar month={{ year: 1404, month: 5 }} onMonthChange={onMonthChange} />);
    expect(screen.getByRole("grid")).toHaveAccessibleName(heading("مرداد", "1404"));
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    expect(onMonthChange).toHaveBeenCalledWith({ year: 1404, month: 6 });
    expect(screen.getByRole("grid")).toHaveAccessibleName(heading("مرداد", "1404"));
  });

  it("focuses the active day on mount with autoFocus", () => {
    render(<PersianCalendar autoFocus defaultValue="2025-04-04" />);
    expect(day("2025-04-04")).toHaveFocus();
  });

  it("puts only one day in the tab order: selected, else today, else the first day", () => {
    const { rerender } = render(<PersianCalendar defaultMonth={{ year: 1404, month: 1 }} />);
    expect(day("2025-03-21")).toHaveAttribute("tabindex", "0");
    rerender(<PersianCalendar defaultMonth={{ year: 1404, month: 1 }} value="2025-04-04" />);
    expect(day("2025-04-04")).toHaveAttribute("tabindex", "0");
    expect(day("2025-03-21")).toHaveAttribute("tabindex", "-1");
    rerender(<PersianCalendar month={{ year: 1404, month: 3 }} value={null} />);
    expect(day("2025-05-22")).toHaveAttribute("tabindex", "0");
  });

  it("adds class names to each part", () => {
    const { container } = render(
      <PersianCalendar defaultValue="2025-04-04" className="c" classNames={{ root: "r", daySelected: "sel", dayToday: "now" }} />,
    );
    expect(container.firstElementChild).toHaveClass("pui-calendar", "c", "r");
    expect(day("2025-04-04")).toHaveClass("sel");
    expect(day("2025-03-21")).toHaveClass("now");
  });

  it("never gets stuck on a daylight-saving day (30 Shahrivar 1400 in Tehran)", async () => {
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <PersianCalendar defaultValue="2021-09-21" />
      </DirectionProvider>,
    );
    day("2021-09-21").focus();
    await user.keyboard("{ArrowLeft}");
    expect(day("2021-09-22")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(day("2021-09-20")).toHaveFocus();
  });

  it("keeps the day of the month when paging, clamped to the month's length", async () => {
    const user = userEvent.setup();
    render(<PersianCalendar defaultValue="2025-09-22" />); // 31 Shahrivar 1404
    day("2025-09-22").focus();
    await user.keyboard("{PageDown}");
    expect(day("2025-10-22")).toHaveFocus(); // 30 Mehr: Mehr has 30 days
    await user.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(day("2024-10-21")).toHaveFocus(); // 30 Mehr 1403
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(day("2025-10-22")).toHaveFocus(); // 30 Mehr 1404
  });

  describe.each(DIRECTION_SETUPS)("keyboard in a $name", (direction) => {
    const next = direction.dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}";
    const previous = direction.dir === "rtl" ? "{ArrowRight}" : "{ArrowLeft}";

    it("moves with the arrow that points the reading direction", async () => {
      const user = userEvent.setup();
      const { container } = renderWithDirection(<PersianCalendar defaultValue="2025-04-04" />, direction);
      day("2025-04-04").focus();

      await user.keyboard(next);
      expect(day("2025-04-05")).toHaveFocus();
      await user.keyboard(`${previous}${previous}`);
      expect(day("2025-04-03")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(day("2025-04-10")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(day("2025-04-03")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(day("2025-03-29")).toHaveFocus(); // Saturday
      await user.keyboard("{End}");
      expect(day("2025-04-04")).toHaveFocus(); // Friday
      await user.keyboard("{Enter}");
      expect(day("2025-04-04").closest("td")).toHaveAttribute("aria-selected", "true");

      await expectNoA11yViolations(container);
    });

    it("changes month when focus leaves it", async () => {
      const user = userEvent.setup();
      renderWithDirection(<PersianCalendar defaultValue="2025-04-20" />, direction); // 31 Farvardin
      day("2025-04-20").focus();
      await user.keyboard(next);
      expect(day("2025-04-21")).toHaveFocus();
      expect(screen.getByRole("grid")).toHaveAccessibleName(heading("اردیبهشت", "1404"));
      await user.keyboard("{PageUp}");
      expect(screen.getByRole("grid")).toHaveAccessibleName(heading("فروردین", "1404"));
      expect(day("2025-03-21")).toHaveFocus();
    });
  });
});
