import { formatJalali, toGregorian, toJalali } from "@amirjaz/persian-ui/core";
import { forwardRef, useId, useState, type ReactElement, type ReactNode } from "react";
import {
  PersianCalendar,
  type CalendarClassNames,
  type DateChangeDetails,
  type PersianCalendarProps,
} from "../calendar/PersianCalendar";
import { isoToLocalDate, monthOf, todayIso } from "../calendar/dates";
import { DEFAULT_CALENDAR_LABELS, type CalendarLabels } from "../calendar/labels";
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

export type { DatePickerMessages } from "./shared";

export interface DatePickerLabels extends CalendarLabels {
  /** Accessible name of the button that opens the calendar. */
  openCalendar: string;
  /** Accessible name of the calendar dialog. */
  dialog: string;
  today: string;
  clear: string;
}

export interface DatePickerClassNames extends CalendarClassNames {
  input: string;
  trigger: string;
  popup: string;
  footer: string;
  todayButton: string;
  clearButton: string;
}

export interface PersianDatePickerProps
  extends Omit<PersianCalendarProps, "autoFocus" | "labels" | "classNames" | "style" | "aria-label"> {
  label?: ReactNode;
  hint?: ReactNode;
  /** An error to show instead of the built-in ones. */
  error?: ReactNode;
  placeholder?: string;
  /** Submits the ISO date (`YYYY-MM-DD`) with native forms. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Whether the calendar is open (controlled). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the Today and Clear buttons. Default `true`. */
  showFooter?: boolean;
  /** Use the single child element as the calendar button (it receives the button's props). */
  asChild?: boolean;
  children?: ReactElement;
  labels?: Partial<DatePickerLabels>;
  messages?: Partial<DatePickerMessages>;
  classNames?: Partial<DatePickerClassNames>;
  /** Accessible name of the text field when there is no `label`. */
  "aria-label"?: string;
}

const DEFAULT_LABELS: DatePickerLabels = {
  ...DEFAULT_CALENDAR_LABELS,
  openCalendar: "انتخاب تاریخ از تقویم",
  dialog: "انتخاب تاریخ",
  today: "امروز",
  clear: "پاک کردن",
};

function detailsOf(iso: string | null): DateChangeDetails {
  return iso === null ? { jalali: null, date: null } : { jalali: toJalali(iso), date: isoToLocalDate(iso) };
}

/**
 * A Jalali date field following the WAI-ARIA date picker dialog pattern: type
 * the date, or open the calendar with the button (or Alt+↓). The calendar
 * opens in a modal dialog that traps focus; Escape closes it and returns focus
 * to the button. The value is an ISO date string (`YYYY-MM-DD`, Gregorian).
 */
export const PersianDatePicker = forwardRef<HTMLInputElement, PersianDatePickerProps>(
  function PersianDatePicker(
    {
      value: valueProp,
      defaultValue = null,
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
      name,
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
    const messages = { ...DEFAULT_DATE_PICKER_MESSAGES, ...messagesProp };
    const explicitDir = useExplicitDirection(dir);
    const generatedId = useId();
    const ids = {
      inputId: id ?? `${generatedId}-input`,
      hintId: `${generatedId}-hint`,
      errorId: `${generatedId}-error`,
    };
    const dialogId = `${generatedId}-dialog`;

    const [value, setValue] = useControllableState<string | null>(valueProp, defaultValue);
    const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
    const format = (iso: string | null) => (iso === null ? "" : formatJalali(iso, { digits }));
    const [text, setText] = useState(() => format(value));
    const [shownValue, setShownValue] = useState(value);
    const [entryError, setEntryError] = useState<keyof DatePickerMessages | null>(null);
    const [touched, setTouched] = useState(false);
    const { rootRef, triggerRef, popupRef, side, close, handleDialogKeyDown } = useCalendarDialog(open, setOpen);

    // The value changed from outside (or from the calendar): show it in the field.
    if (value !== shownValue) {
      setShownValue(value);
      setText(format(value));
      setEntryError(null);
    }

    const problemWith = (iso: string) => dateProblem(iso, min, max, isDateDisabled);

    const commit = (iso: string | null) => {
      setEntryError(null);
      setText(format(iso));
      if (iso !== value) {
        setValue(iso);
        onValueChange?.(iso, detailsOf(iso));
      }
    };

    const commitText = () => {
      if (text.trim() === "") return commit(null);
      const parsed = parseTyped(text);
      if (!parsed) return setEntryError("invalid");
      const iso = toGregorian(parsed);
      const problem = problemWith(iso);
      if (problem) return setEntryError(problem);
      commit(iso);
    };

    const today = todayIso();
    const message = hasError(error)
      ? error
      : entryError
        ? messages[entryError]
        : touched && required && value === null && text.trim() === ""
          ? messages.required
          : null;

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
        <PersianCalendar
          value={value}
          onValueChange={(iso) => {
            commit(iso);
            close();
          }}
          month={month}
          defaultMonth={defaultMonth ?? (value === null ? undefined : monthOf(value))}
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
              className={cx("pui-date-picker__footer-button", classNames.todayButton)}
              disabled={problemWith(today) !== null}
              onClick={() => {
                commit(today);
                close();
              }}
            >
              {labels.today}
            </button>
            <button
              type="button"
              className={cx("pui-date-picker__footer-button", classNames.clearButton)}
              disabled={value === null}
              onClick={() => {
                commit(null);
                close();
              }}
            >
              {labels.clear}
            </button>
          </div>
        )}
      </div>
    ) : null;

    return (
      <Field
        ids={ids}
        rootRef={rootRef}
        label={label}
        hint={hint}
        error={message}
        dir={explicitDir}
        className={cx("pui-date-picker", className)}
        name={name}
        submitValue={value ?? ""}
        disabled={disabled}
        end={
          <>
            {trigger}
            {popup}
          </>
        }
      >
        <input
          ref={ref}
          id={ids.inputId}
          type="text"
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          className={cx("pui-field__input", classNames.input)}
          placeholder={placeholder ?? (digits === "fa" ? "۱۴۰۴/۰۱/۱۵" : "1404/01/15")}
          value={text}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={hasError(message) || undefined}
          aria-describedby={describedBy(ids, hint, message)}
          onChange={(event) => {
            setText(event.target.value);
            setEntryError(null);
          }}
          onBlur={() => {
            setTouched(true);
            commitText();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitText();
            if (event.key === "ArrowDown" && event.altKey) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
      </Field>
    );
  },
);
