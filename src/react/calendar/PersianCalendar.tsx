import { toJalali } from "@amirjaz/persian-ui/core";
import { useControllableState } from "../utils";
import {
  CalendarCore,
  type CalendarBaseProps,
  type CalendarClassNames,
  type DateChangeDetails,
} from "./CalendarCore";
import { dayToIso, isoToDay, isoToLocalDate } from "./dates";
import { DEFAULT_CALENDAR_LABELS, type CalendarLabels } from "./labels";

export type { CalendarClassNames, DateChangeDetails, YearRange } from "./CalendarCore";

export interface PersianCalendarProps extends CalendarBaseProps {
  /** Selected day as an ISO date (`YYYY-MM-DD`, Gregorian), or `null`. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, details: DateChangeDetails) => void;
  labels?: Partial<CalendarLabels>;
  classNames?: Partial<CalendarClassNames>;
}

/**
 * A Jalali month grid following the WAI-ARIA grid pattern. Arrow keys follow
 * the reading direction (in RTL, ← moves to the next day); Home/End go to the
 * start/end of the week, PageUp/PageDown change the month and Shift+PageUp/
 * PageDown the year. Month changes are announced to screen readers.
 */
export function PersianCalendar({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  labels,
  classNames = {},
  ...props
}: PersianCalendarProps) {
  const [value, setValue] = useControllableState<string | null>(valueProp, defaultValue);
  const selectedDay = value === null ? null : isoToDay(value);

  return (
    <CalendarCore
      {...props}
      labels={{ ...DEFAULT_CALENDAR_LABELS, ...labels }}
      classNames={classNames}
      preferredDays={[selectedDay]}
      marks={(day) => ({ selected: day === selectedDay, picked: day === selectedDay })}
      onSelect={(day) => {
        const iso = dayToIso(day);
        setValue(iso);
        onValueChange?.(iso, { jalali: toJalali(iso), date: isoToLocalDate(iso) });
      }}
    />
  );
}
