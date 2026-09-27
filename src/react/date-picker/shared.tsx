import { parseJalali, toEnglishDigits, type JalaliDate } from "@amirjaz/persian-ui/core";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

/** Error messages of the date pickers; all can be overridden with `messages`. */
export interface DatePickerMessages {
  required: string;
  /** The typed text isn't a date. */
  invalid: string;
  /** The typed date is before `min` or after `max`. */
  outOfRange: string;
  /** The typed date is excluded by `isDateDisabled`. */
  unavailable: string;
}

export const DEFAULT_DATE_PICKER_MESSAGES: DatePickerMessages = {
  required: "تاریخ را وارد کنید.",
  invalid: "تاریخ معتبر نیست. نمونه: ۱۴۰۴/۰۱/۱۵",
  outOfRange: "این تاریخ خارج از بازهٔ مجاز است.",
  unavailable: "این تاریخ قابل انتخاب نیست.",
};

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), select:not([disabled]), [tabindex="0"]';

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Reads «۱۴۰۴/۰۱/۱۵», «1404-1-15» and, for number-only keyboards, «14040115». */
export function parseTyped(text: string): JalaliDate | null {
  const compact = toEnglishDigits(text).trim();
  if (/^\d{8}$/.test(compact)) {
    return parseJalali(`${compact.slice(0, 4)}/${compact.slice(4, 6)}/${compact.slice(6)}`);
  }
  return parseJalali(text);
}

/** Why a typed ISO date can't be used, or `null` if it can. */
export function dateProblem(
  iso: string,
  min: string | undefined,
  max: string | undefined,
  isDateDisabled: ((iso: string) => boolean) | undefined,
): "outOfRange" | "unavailable" | null {
  if ((min !== undefined && iso < min) || (max !== undefined && iso > max)) return "outOfRange";
  return isDateDisabled?.(iso) ? "unavailable" : null;
}

/**
 * The calendar dialog of a date picker (WAI-ARIA date picker dialog pattern):
 * closes on a click outside the field, opens upwards when there's no room
 * below, closes on Escape with focus back on the button, and keeps Tab inside.
 */
export function useCalendarDialog(open: boolean, setOpen: (open: boolean) => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<"bottom" | "top">("bottom");

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

  return { rootRef, triggerRef, popupRef, side, close, handleDialogKeyDown };
}

export function CalendarIcon() {
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
