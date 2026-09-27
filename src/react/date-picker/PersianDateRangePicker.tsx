import { formatJalali, toGregorian } from "@amirjaz/persian-ui/core";
import { forwardRef, useId, useState, type ReactElement, type ReactNode } from "react";
import type { RangeCalendarClassNames } from "../calendar/CalendarCore";
import { monthOf } from "../calendar/dates";
import { DEFAULT_RANGE_CALENDAR_LABELS, type RangeCalendarLabels } from "../calendar/labels";
import {
  EMPTY_RANGE,
  PersianRangeCalendar,
  rangeDetails,
  type DateRange,
  type PersianRangeCalendarProps,
} from "../calendar/PersianRangeCalendar";
import { useExplicitDirection } from "../direction";
import { Field, describedBy, hasError } from "../field/Field";
import { Slot } from "../slot";
import { cx, useControllableState } from "../utils";
import {
  CalendarIcon,
  DEFAULT_DATE_PICKER_MESSAGES,
  dateProblem,
  parseTyped,
  useCalendarDialog,
  type DatePickerMessages,
} from "./shared";

export interface DateRangePickerLabels extends RangeCalendarLabels {
  /** Shown before the start input. */
  from: string;
  /** Shown before the end input. */
  to: string;
  /** Accessible name of the button that opens the calendar. */
  openCalendar: string;
  /** Accessible name of the calendar dialog. */
  dialog: string;
  clear: string;
}

export interface DateRangePickerMessages extends DatePickerMessages {
  /** The end is before the start. */
  order: string;
}

export interface DateRangePickerClassNames extends RangeCalendarClassNames {
  startInput: string;
  endInput: string;
  trigger: string;
  popup: string;
  footer: string;
  clearButton: string;
}

export interface PersianDateRangePickerProps
  extends Omit<PersianRangeCalendarProps, "autoFocus" | "labels" | "classNames" | "style" | "aria-label"> {
  label?: ReactNode;
  hint?: ReactNode;
  /** An error to show instead of the built-in ones. */
  error?: ReactNode;
  /** Placeholder of both inputs. */
  placeholder?: string;
  /** Submits the start (ISO date) with native forms. */
  startName?: string;
  /** Submits the end (ISO date) with native forms. */
  endName?: string;
  /** Both dates are required. */
  required?: boolean;
  disabled?: boolean;
  /** Whether the calendar is open (controlled). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the Clear button. Default `true`. */
  showFooter?: boolean;
  /** Use the single child element as the calendar button (it receives the button's props). */
  asChild?: boolean;
  children?: ReactElement;
  labels?: Partial<DateRangePickerLabels>;
  messages?: Partial<DateRangePickerMessages>;
  classNames?: Partial<DateRangePickerClassNames>;
  /** Accessible name of the field when there is no `label`; the inputs add «از» and «تا». */
  "aria-label"?: string;
}

type Part = "start" | "end";

const DEFAULT_LABELS: DateRangePickerLabels = {
  ...DEFAULT_RANGE_CALENDAR_LABELS,
  from: "از",
  to: "تا",
  openCalendar: "انتخاب بازه از تقویم",
  dialog: "انتخاب بازهٔ تاریخ",
  clear: "پاک کردن",
};

const DEFAULT_MESSAGES: DateRangePickerMessages = {
  ...DEFAULT_DATE_PICKER_MESSAGES,
  required: "تاریخ شروع و پایان را وارد کنید.",
  order: "تاریخ پایان نباید پیش از تاریخ شروع باشد.",
};

/**
 * A field for a range of Jalali dates: two inputs («از» and «تا») and one
 * calendar button. Each input takes typed dates like `PersianDatePicker`; the
 * calendar dialog stays open after the start is picked and closes after the
 * end. The value is `{ start, end }` as ISO dates (`YYYY-MM-DD`).
 */
export const PersianDateRangePicker = forwardRef<HTMLInputElement, PersianDateRangePickerProps>(
  function PersianDateRangePicker(
    {
      value: valueProp,
      defaultValue = EMPTY_RANGE,
      onValueChange,
      month,
      defaultMonth,
      onMonthChange,
      min,
      max,
      isDateDisabled,
      showGregorian,
      showHolidays,
      digits = "fa",
      weekStartsOn,
      yearRange,
      label,
      hint,
      error,
      placeholder,
      startName,
      endName,
      required,
      disabled,
      id,
      className,
      dir,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      showFooter = true,
      asChild = false,
      children,
      labels: labelsProp,
      messages: messagesProp,
      classNames = {},
      "aria-label": ariaLabel,
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const messages = { ...DEFAULT_MESSAGES, ...messagesProp };
    const explicitDir = useExplicitDirection(dir);
    const generatedId = useId();
    const ids = {
      inputId: id ?? `${generatedId}-start`,
      hintId: `${generatedId}-hint`,
      errorId: `${generatedId}-error`,
      labelId: `${generatedId}-label`,
    };
    const endInputId = `${generatedId}-end`;
    const fromId = `${generatedId}-from`;
    const toId = `${generatedId}-to`;
    const dialogId = `${generatedId}-dialog`;

    const [range, setRange] = useControllableState<DateRange>(valueProp, defaultValue);
    const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
    const format = (iso: string | null) => (iso === null ? "" : formatJalali(iso, { digits }));
    const [texts, setTexts] = useState(() => ({ start: format(range.start), end: format(range.end) }));
    const [shownRange, setShownRange] = useState(range);
    const [entryError, setEntryError] = useState<{ part: Part; reason: keyof DateRangePickerMessages } | null>(
      null,
    );
    const [touched, setTouched] = useState({ start: false, end: false });
    const { rootRef, triggerRef, popupRef, side, close, handleDialogKeyDown } = useCalendarDialog(open, setOpen);

    // The value changed from outside (or from the calendar): show it in the inputs.
    if (range.start !== shownRange.start || range.end !== shownRange.end) {
      setShownRange(range);
      setTexts({ start: format(range.start), end: format(range.end) });
      setEntryError(null);
    }

    const commit = (next: DateRange) => {
      setEntryError(null);
      setTexts({ start: format(next.start), end: format(next.end) });
      if (next.start !== range.start || next.end !== range.end) {
        setRange(next);
        onValueChange?.(next, rangeDetails(next));
      }
    };

    /** The date typed in one input, or why it can't be used. */
    const read = (part: Part): { iso: string | null } | { reason: "invalid" | "outOfRange" | "unavailable" } => {
      const text = texts[part];
      if (text.trim() === "") return { iso: null };
      const parsed = parseTyped(text);
      if (!parsed) return { reason: "invalid" };
      const iso = toGregorian(parsed);
      const problem = dateProblem(iso, min, max, isDateDisabled);
      return problem ? { reason: problem } : { iso };
    };

    // Reads both inputs, so a bad date left in the other one is never dropped silently.
    const commitTexts = (part: Part) => {
      const other: Part = part === "start" ? "end" : "start";
      const results = { start: read("start"), end: read("end") };
      for (const checked of [part, other]) {
        const result = results[checked];
        if ("reason" in result) return setEntryError({ part: checked, reason: result.reason });
      }
      const next = {
        start: (results.start as { iso: string | null }).iso,
        end: (results.end as { iso: string | null }).iso,
      };
      if (next.start !== null && next.end !== null && next.end < next.start) {
        return setEntryError({ part, reason: "order" });
      }
      commit(next);
    };

    const missing =
      required && ((touched.start && texts.start.trim() === "") || (touched.end && texts.end.trim() === ""));
    const message = hasError(error)
      ? error
      : entryError
        ? messages[entryError.reason]
        : missing
          ? messages.required
          : null;
    const invalidPart: Part | null = !hasError(message)
      ? null
      : entryError
        ? entryError.part
        : touched.start && texts.start.trim() === ""
          ? "start"
          : "end";

    const triggerProps = {
      ref: triggerRef,
      type: "button",
      disabled,
      "aria-label": labels.openCalendar,
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": open ? dialogId : undefined,
      className: cx("pui-date-picker__trigger", classNames.trigger),
      onClick: () => setOpen(!open),
    } as const;

    const trigger =
      asChild && children ? (
        <Slot {...triggerProps}>{children}</Slot>
      ) : (
        <button {...triggerProps}>
          <CalendarIcon />
        </button>
      );

    const popup = open ? (
      // The dialog container handles Escape and the focus trap for everything inside it.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        ref={popupRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label={labels.dialog}
        className={cx("pui-date-picker__popup", classNames.popup)}
        data-side={side}
        onKeyDown={handleDialogKeyDown}
      >
        <PersianRangeCalendar
          value={range}
          onValueChange={(next) => {
            commit(next);
            if (next.end !== null) close();
          }}
          month={month}
          defaultMonth={defaultMonth ?? (range.start === null ? undefined : monthOf(range.start))}
          onMonthChange={onMonthChange}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          showGregorian={showGregorian}
          showHolidays={showHolidays}
          digits={digits}
          weekStartsOn={weekStartsOn}
          yearRange={yearRange}
          labels={labelsProp}
          classNames={classNames}
          autoFocus
        />
        {showFooter && (
          <div className={cx("pui-date-picker__footer", classNames.footer)}>
            <button
              type="button"
              className={cx("pui-date-picker__footer-button", classNames.clearButton)}
              disabled={range.start === null && range.end === null}
              onClick={() => {
                commit(EMPTY_RANGE);
                close();
              }}
            >
              {labels.clear}
            </button>
          </div>
        )}
      </div>
    ) : null;

    const input = (part: Part) => {
      const partLabelId = part === "start" ? fromId : toId;
      return (
        <input
          ref={part === "start" ? ref : undefined}
          id={part === "start" ? ids.inputId : endInputId}
          type="text"
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          className={cx(
            "pui-field__input",
            "pui-date-range-picker__input",
            part === "start" ? classNames.startInput : classNames.endInput,
          )}
          placeholder={placeholder ?? (digits === "fa" ? "۱۴۰۴/۰۱/۱۵" : "1404/01/15")}
          value={texts[part]}
          required={required}
          disabled={disabled}
          aria-labelledby={label != null ? `${ids.labelId} ${partLabelId}` : ariaLabel ? undefined : partLabelId}
          aria-label={label == null && ariaLabel ? `${ariaLabel} ${labels[part === "start" ? "from" : "to"]}` : undefined}
          aria-invalid={invalidPart === part || undefined}
          aria-describedby={describedBy(ids, hint, message)}
          onChange={(event) => {
            const text = event.target.value;
            setTexts((current) => ({ ...current, [part]: text }));
            setEntryError(null);
          }}
          onBlur={() => {
            setTouched((current) => ({ ...current, [part]: true }));
            commitTexts(part);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitTexts(part);
            if (event.key === "ArrowDown" && event.altKey) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
      );
    };

    return (
      <Field
        ids={ids}
        rootRef={rootRef}
        label={label}
        hint={hint}
        error={message}
        dir={explicitDir}
        className={cx("pui-date-picker", "pui-date-range-picker", className)}
        submitValue=""
        disabled={disabled}
        end={
          <>
            {trigger}
            {popup}
          </>
        }
        after={
          <>
            {startName !== undefined && <input type="hidden" name={startName} value={range.start ?? ""} />}
            {endName !== undefined && <input type="hidden" name={endName} value={range.end ?? ""} />}
          </>
        }
      >
        <span id={fromId} className="pui-field__affix">
          {labels.from}
        </span>
        {input("start")}
        <span id={toId} className="pui-field__affix">
          {labels.to}
        </span>
        {input("end")}
      </Field>
    );
  },
);
