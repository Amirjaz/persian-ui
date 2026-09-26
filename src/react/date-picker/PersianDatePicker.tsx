import { formatJalali, parseJalali, toEnglishDigits, toGregorian, toJalali, type JalaliDate } from "@amirjaz/persian-ui/core";
import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
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

export interface DatePickerLabels extends CalendarLabels {
  /** Accessible name of the button that opens the calendar. */
  openCalendar: string;
  /** Accessible name of the calendar dialog. */
  dialog: string;
  today: string;
  clear: string;
}

export interface DatePickerMessages {
  required: string;
  /** The typed text isn't a date. */
  invalid: string;
  /** The typed date is before `min` or after `max`. */
  outOfRange: string;
  /** The typed date is excluded by `isDateDisabled`. */
  unavailable: string;
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

const DEFAULT_MESSAGES: DatePickerMessages = {
  required: "تاریخ را وارد کنید.",
  invalid: "تاریخ معتبر نیست. نمونه: ۱۴۰۴/۰۱/۱۵",
  outOfRange: "این تاریخ خارج از بازهٔ مجاز است.",
  unavailable: "این تاریخ قابل انتخاب نیست.",
};

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), select:not([disabled]), [tabindex="0"]';

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Reads «۱۴۰۴/۰۱/۱۵», «1404-1-15» and, for number-only keyboards, «14040115». */
function parseTyped(text: string): JalaliDate | null {
  const compact = toEnglishDigits(text).trim();
  if (/^\d{8}$/.test(compact)) {
    return parseJalali(`${compact.slice(0, 4)}/${compact.slice(4, 6)}/${compact.slice(6)}`);
  }
  return parseJalali(text);
}

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
    const messages = { ...DEFAULT_MESSAGES, ...messagesProp };
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
    const [side, setSide] = useState<"bottom" | "top">("bottom");
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // The value changed from outside (or from the calendar): show it in the field.
    if (value !== shownValue) {
      setShownValue(value);
      setText(format(value));
      setEntryError(null);
    }

    const problemWith = (iso: string): keyof DatePickerMessages | null => {
      if ((min !== undefined && iso < min) || (max !== undefined && iso > max)) return "outOfRange";
      return isDateDisabled?.(iso) ? "unavailable" : null;
    };

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

    const close = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };

    // Close when the user clicks or taps outside the field.
    useEffect(() => {
      if (!open) return;
      const document = rootRef.current?.ownerDocument;
      const onPointerDown = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
      };
      document?.addEventListener("pointerdown", onPointerDown);
      return () => document?.removeEventListener("pointerdown", onPointerDown);
    }, [open, setOpen]);

    // Open upwards when there isn't room below.
    useIsomorphicLayoutEffect(() => {
      const popup = popupRef.current;
      const control = popup?.parentElement;
      if (!open || !popup || !control) return;
      const room = control.getBoundingClientRect();
      const below = popup.ownerDocument.defaultView!.innerHeight - room.bottom;
      const height = popup.getBoundingClientRect().height;
      setSide(below < height && room.top > below ? "top" : "bottom");
    }, [open]);

    const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep focus inside the dialog while it is open.
      const focusables = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = event.currentTarget.ownerDocument.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
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

function CalendarIcon() {
  return (
    <svg
      className="pui-date-picker__icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
