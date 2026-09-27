import {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  formatJalali,
  toJalali,
  toPersianDigits,
  type Digits,
  type JalaliDate,
} from "@amirjaz/persian-ui/core";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { getDirection, useExplicitDirection, type Direction } from "../direction";
import { cx, useControllableState } from "../utils";
import {
  addMonths,
  buildMonthGrid,
  compareMonths,
  dayToIso,
  firstDayOf,
  isoToDay,
  lastDayOf,
  monthOf,
  persianWeekday,
  shiftMonths,
  todayIso,
  weekColumn,
  type JalaliMonth,
} from "./dates";
import { holidayOn } from "./holidays";
import { GREGORIAN_MONTH_NAMES, type CalendarLabels } from "./labels";

export interface DateChangeDetails {
  /** The picked day in the Jalali calendar, or `null` when cleared. */
  jalali: JalaliDate | null;
  /** The picked day as a local-midnight `Date`, or `null` when cleared. */
  date: Date | null;
}

/** Extra class names per part, added next to the built-in `pui-*` classes. */
export interface CalendarClassNames {
  root: string;
  header: string;
  navButtonPrev: string;
  navButtonNext: string;
  monthSelect: string;
  yearSelect: string;
  grid: string;
  weekday: string;
  day: string;
  dayToday: string;
  daySelected: string;
  dayOutside: string;
  dayDisabled: string;
  dayWeekend: string;
  dayHoliday: string;
}

/** Class names of a range calendar: the single-date ones plus the range's days. */
export interface RangeCalendarClassNames extends CalendarClassNames {
  dayRangeStart: string;
  dayInRange: string;
  dayRangeEnd: string;
  /** Days between the start and the hovered or focused day, before the end is picked. */
  dayRangePreview: string;
}

export interface YearRange {
  /** Years before the current year offered in the year list. Default 100. */
  back?: number;
  /** Years after the current year offered in the year list. Default 10. */
  forward?: number;
}

/** Props shared by `PersianCalendar` and `PersianRangeCalendar`. */
export interface CalendarBaseProps {
  /** Displayed Jalali month (controlled). */
  month?: JalaliMonth;
  defaultMonth?: JalaliMonth;
  onMonthChange?: (month: JalaliMonth) => void;
  /** Earliest selectable day (ISO, inclusive). */
  min?: string;
  /** Latest selectable day (ISO, inclusive). */
  max?: string;
  /** Return `true` to make a day unselectable. */
  isDateDisabled?: (iso: string) => boolean;
  /** Show Gregorian day numbers and the Gregorian months. Default `false`. */
  showGregorian?: boolean;
  /** Mark Iranian public holidays. Lunar ones can be off by a day. Default `true`. */
  showHolidays?: boolean;
  /** Digit glyphs. Default `"fa"`. */
  digits?: Digits;
  /** First day of the week: 6 = Saturday (default), 0 = Sunday. */
  weekStartsOn?: 0 | 6;
  yearRange?: YearRange;
  dir?: Direction;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Move focus to the active day when the calendar mounts. */
  autoFocus?: boolean;
  "aria-label"?: string;
}

/** How a day takes part in the selection. */
export interface DayMarks {
  /** Part of the selection (`aria-selected`): the day, or a range's start, end and days between. */
  selected: boolean;
  /** Drawn as a picked day: the selected day, or a range's start or end. */
  picked: boolean;
  rangeStart?: boolean;
  inRange?: boolean;
  rangeEnd?: boolean;
  preview?: boolean;
  /** Appended to the day's accessible name, e.g. «آغاز بازه». */
  description?: string | undefined;
}

interface CalendarCoreProps extends CalendarBaseProps {
  labels: CalendarLabels;
  classNames: Partial<RangeCalendarClassNames>;
  /** Days that should take the tab stop when in view, most important first. */
  preferredDays: ReadonlyArray<number | null>;
  marks: (day: number) => DayMarks;
  /** Called for enabled days only. */
  onSelect: (day: number) => void;
  /** The day being hovered or focused, or `null` when the pointer leaves the grid. */
  onPreview?: (day: number | null) => void;
  /** Extra text for screen readers, announced when it changes. */
  announcement?: string;
}

const digitsOf = (text: string | number, digits: Digits) =>
  digits === "fa" ? toPersianDigits(text) : String(text);

/**
 * The month grid behind both calendars, following the WAI-ARIA grid pattern.
 * Arrow keys follow the reading direction (in RTL, ← moves to the next day);
 * Home/End go to the start/end of the week, PageUp/PageDown change the month
 * and Shift+PageUp/PageDown the year. Month changes are announced.
 */
export function CalendarCore({
  month: monthProp,
  defaultMonth,
  onMonthChange,
  min,
  max,
  isDateDisabled,
  showGregorian = false,
  showHolidays = true,
  digits = "fa",
  weekStartsOn = 6,
  yearRange,
  labels,
  classNames,
  dir,
  className,
  style,
  id,
  autoFocus = false,
  "aria-label": ariaLabel,
  preferredDays,
  marks,
  onSelect,
  onPreview,
  announcement,
}: CalendarCoreProps) {
  const explicitDir = useExplicitDirection(dir);
  const headingId = `${useId()}-heading`;
  const today = todayIso();
  const minDay = min === undefined ? -Infinity : isoToDay(min);
  const maxDay = max === undefined ? Infinity : isoToDay(max);
  const firstPreferred = preferredDays.find((day): day is number => day !== null);

  const [month, setMonth] = useControllableState<JalaliMonth>(
    monthProp,
    defaultMonth ?? monthOf(dayToIso(firstPreferred ?? clamp(isoToDay(today), minDay, maxDay))),
    onMonthChange,
  );
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const focusRequested = useRef(autoFocus);
  const gridRef = useRef<HTMLTableElement>(null);

  const isDisabled = (day: number) =>
    day < minDay || day > maxDay || Boolean(isDateDisabled?.(dayToIso(day)));
  const inMonth = (day: number) => day >= firstDayOf(month) && day <= lastDayOf(month);

  // The day that takes part in the tab order: the last focused one while it is
  // in view, else a selected day, today, or the first day of the month.
  const preferredKey = preferredDays.join();
  const activeDay = useMemo(() => {
    const candidates = [focusedDay, ...preferredDays, isoToDay(today)];
    const visible = candidates.find((day): day is number => day !== null && day !== undefined && inMonth(day));
    return visible ?? clamp(firstDayOf(month), minDay, maxDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDay, preferredKey, today, month.year, month.month, minDay, maxDay]);

  useEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${activeDay}"]`)?.focus();
  });

  const weeks = useMemo(
    () => buildMonthGrid(month, weekStartsOn),
    [month.year, month.month, weekStartsOn], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const showMonthOf = (day: number) => {
    const target = monthOf(dayToIso(day));
    if (compareMonths(target, month) !== 0) setMonth(target);
  };

  const moveFocus = (day: number) => {
    const target = clamp(day, minDay, maxDay);
    setFocusedDay(target);
    showMonthOf(target);
    focusRequested.current = true;
  };

  const select = (day: number) => {
    if (isDisabled(day)) return;
    setFocusedDay(day);
    showMonthOf(day);
    onSelect(day);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: number) => {
    const rtl = getDirection(event.currentTarget) === "rtl";
    const targets: Record<string, () => number> = {
      ArrowRight: () => day + (rtl ? -1 : 1),
      ArrowLeft: () => day + (rtl ? 1 : -1),
      ArrowUp: () => day - 7,
      ArrowDown: () => day + 7,
      Home: () => day - weekColumn(day, weekStartsOn),
      End: () => day + 6 - weekColumn(day, weekStartsOn),
      PageUp: () => shiftMonths(day, event.shiftKey ? -12 : -1),
      PageDown: () => shiftMonths(day, event.shiftKey ? 12 : 1),
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    moveFocus(target());
  };

  const previousMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const heading = `${JALALI_MONTH_NAMES[month.month - 1]} ${digitsOf(month.year, digits)}`;
  const years = yearOptions(toJalali(today).year, month.year, yearRange, min, max);
  const weekdayOrder = weekStartsOn === 6 ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];

  return (
    <div
      id={id}
      className={cx("pui-calendar", className, classNames.root)}
      style={style}
      dir={explicitDir}
      role="group"
      aria-label={ariaLabel ?? labels.calendar}
    >
      <div className={cx("pui-calendar__header", classNames.header)}>
        <button
          type="button"
          className={cx("pui-calendar__nav", classNames.navButtonPrev)}
          aria-label={labels.previousMonth}
          disabled={lastDayOf(previousMonth) < minDay}
          onClick={() => setMonth(previousMonth)}
        >
          {/* ‹ and › are mirrored by the browser in right-to-left text. */}
          <span aria-hidden="true">‹</span>
        </button>
        <div className="pui-calendar__title">
          <select
            className={cx("pui-calendar__select", classNames.monthSelect)}
            aria-label={labels.month}
            value={month.month}
            onChange={(event) => setMonth({ year: month.year, month: Number(event.target.value) })}
          >
            {JALALI_MONTH_NAMES.map((name, index) => {
              const option = { year: month.year, month: index + 1 };
              return (
                <option
                  key={name}
                  value={index + 1}
                  disabled={lastDayOf(option) < minDay || firstDayOf(option) > maxDay}
                >
                  {name}
                </option>
              );
            })}
          </select>
          <select
            className={cx("pui-calendar__select", classNames.yearSelect)}
            aria-label={labels.year}
            value={month.year}
            onChange={(event) => setMonth({ year: Number(event.target.value), month: month.month })}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {digitsOf(year, digits)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={cx("pui-calendar__nav", classNames.navButtonNext)}
          aria-label={labels.nextMonth}
          disabled={firstDayOf(nextMonth) > maxDay}
          onClick={() => setMonth(nextMonth)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {/* Names the grid and announces month changes. */}
      <div id={headingId} className="pui-sr-only" aria-live="polite">
        {heading}
      </div>
      {announcement !== undefined && (
        <div className="pui-sr-only" aria-live="polite">
          {announcement}
        </div>
      )}
      {showGregorian && (
        <div className="pui-calendar__gregorian-range" aria-hidden="true">
          {gregorianRange(month, digits)}
        </div>
      )}

      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={headingId}
        className={cx("pui-calendar__grid", classNames.grid)}
        onMouseLeave={onPreview && (() => onPreview(null))}
      >
        <thead>
          <tr>
            {weekdayOrder.map((weekday) => {
              const name = PERSIAN_WEEKDAY_NAMES[weekday]!;
              return (
                <th
                  key={weekday}
                  scope="col"
                  abbr={name}
                  className={cx("pui-calendar__weekday", classNames.weekday)}
                >
                  <span aria-hidden="true">{name.charAt(0)}</span>
                  <span className="pui-sr-only">{name}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]!.day}>
              {week.map(({ day, iso, jalali, inMonth: current }) => {
                const mark = marks(day);
                const disabled = isDisabled(day);
                const isToday = iso === today;
                const weekend = persianWeekday(day) === 6;
                const holiday = showHolidays ? holidayOn(day, jalali) : undefined;
                let name = formatJalali(jalali, { format: "long", weekday: true, digits });
                if (holiday) name += `، ${labels.holiday}: ${holiday}`;
                if (mark.description) name += `، ${mark.description}`;
                return (
                  <td key={day} role="gridcell" aria-selected={mark.selected}>
                    <button
                      type="button"
                      tabIndex={day === activeDay ? 0 : -1}
                      data-day={day}
                      data-outside={!current || undefined}
                      data-today={isToday || undefined}
                      data-selected={mark.picked || undefined}
                      data-range-start={mark.rangeStart || undefined}
                      data-in-range={mark.inRange || undefined}
                      data-range-end={mark.rangeEnd || undefined}
                      data-range-preview={mark.preview || undefined}
                      data-disabled={disabled || undefined}
                      data-weekend={weekend || undefined}
                      data-holiday={holiday ? "" : undefined}
                      className={cx(
                        "pui-calendar__day",
                        classNames.day,
                        !current && classNames.dayOutside,
                        isToday && classNames.dayToday,
                        mark.picked && classNames.daySelected,
                        mark.rangeStart && classNames.dayRangeStart,
                        mark.inRange && classNames.dayInRange,
                        mark.rangeEnd && classNames.dayRangeEnd,
                        mark.preview && classNames.dayRangePreview,
                        disabled && classNames.dayDisabled,
                        weekend && classNames.dayWeekend,
                        holiday && classNames.dayHoliday,
                      )}
                      aria-label={name}
                      aria-disabled={disabled || undefined}
                      aria-current={isToday ? "date" : undefined}
                      title={holiday}
                      onClick={() => select(day)}
                      onKeyDown={(event) => handleKeyDown(event, day)}
                      onFocus={() => {
                        setFocusedDay(day);
                        onPreview?.(day);
                      }}
                      onMouseEnter={onPreview && (() => onPreview(day))}
                    >
                      <span aria-hidden="true">{digitsOf(jalali.day, digits)}</span>
                      {showGregorian && (
                        <span className="pui-calendar__gregorian" aria-hidden="true">
                          {digitsOf(Number(iso.slice(8, 10)), digits)}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function clamp(day: number, min: number, max: number): number {
  return Math.min(Math.max(day, min), max);
}

function yearOptions(
  currentYear: number,
  shownYear: number,
  range: YearRange | undefined,
  min: string | undefined,
  max: string | undefined,
): number[] {
  let from = currentYear - (range?.back ?? 100);
  let to = currentYear + (range?.forward ?? 10);
  if (min !== undefined) from = Math.max(from, toJalali(min).year);
  if (max !== undefined) to = Math.min(to, toJalali(max).year);
  from = Math.min(from, shownYear);
  to = Math.max(to, shownYear);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** «مارس – آوریل ۲۰۲۵», or «دسامبر ۲۰۲۴ – ژانویه ۲۰۲۵» across a new year. */
function gregorianRange(month: JalaliMonth, digits: Digits): string {
  const first = dayToIso(firstDayOf(month));
  const last = dayToIso(lastDayOf(month));
  const name = (iso: string) => GREGORIAN_MONTH_NAMES[Number(iso.slice(5, 7)) - 1];
  const year = (iso: string) => iso.slice(0, 4);
  const text =
    year(first) === year(last)
      ? `${name(first)} – ${name(last)} ${year(last)}`
      : `${name(first)} ${year(first)} – ${name(last)} ${year(last)}`;
  return digitsOf(text, digits);
}
