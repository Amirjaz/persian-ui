import { toJalali } from "@amirjaz/persian-ui/core";
import { useState } from "react";
import { useControllableState } from "../utils";
import {
  CalendarCore,
  type CalendarBaseProps,
  type DateChangeDetails,
  type DayMarks,
  type RangeCalendarClassNames,
} from "./CalendarCore";
import { dayToIso, isoToDay, isoToLocalDate } from "./dates";
import { DEFAULT_RANGE_CALENDAR_LABELS, type RangeCalendarLabels } from "./labels";

/** A range of days as ISO dates (`YYYY-MM-DD`). Empty is `{ start: null, end: null }`. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface RangeChangeDetails {
  start: DateChangeDetails;
  end: DateChangeDetails;
}

export interface PersianRangeCalendarProps extends CalendarBaseProps {
  value?: DateRange;
  defaultValue?: DateRange;
  /** Called on every change, including a start without an end yet. */
  onValueChange?: (range: DateRange, details: RangeChangeDetails) => void;
  labels?: Partial<RangeCalendarLabels>;
  classNames?: Partial<RangeCalendarClassNames>;
}

export const EMPTY_RANGE: DateRange = { start: null, end: null };

function dayDetails(iso: string | null): DateChangeDetails {
  return iso === null ? { jalali: null, date: null } : { jalali: toJalali(iso), date: isoToLocalDate(iso) };
}

export function rangeDetails(range: DateRange): RangeChangeDetails {
  return { start: dayDetails(range.start), end: dayDetails(range.end) };
}

/** The range after clicking `iso`: a new start, or the end when it's on or after the start. */
export function nextRange(range: DateRange, iso: string): DateRange {
  if (range.start === null || range.end !== null || iso < range.start) return { start: iso, end: null };
  return { start: range.start, end: iso };
}

/**
 * A Jalali calendar for picking a range of days, with the same keyboard,
 * holidays and options as `PersianCalendar`. The first pick sets the start,
 * the next pick on or after it sets the end, and a pick before the start
 * starts over from that day. Until the end is picked, the days up to the
 * hovered or focused one are previewed.
 */
export function PersianRangeCalendar({
  value: valueProp,
  defaultValue = EMPTY_RANGE,
  onValueChange,
  labels: labelsProp,
  classNames = {},
  ...props
}: PersianRangeCalendarProps) {
  const labels = { ...DEFAULT_RANGE_CALENDAR_LABELS, ...labelsProp };
  const [range, setRange] = useControllableState<DateRange>(valueProp, defaultValue);
  const [previewDay, setPreviewDay] = useState<number | null>(null);

  const startDay = range.start === null ? null : isoToDay(range.start);
  const endDay = range.end === null ? null : isoToDay(range.end);
  const choosingEnd = startDay !== null && endDay === null;
  const previewEnd = choosingEnd && previewDay !== null && previewDay > startDay ? previewDay : null;

  const marks = (day: number): DayMarks => {
    const rangeStart = day === startDay;
    const rangeEnd = day === endDay;
    const inRange = startDay !== null && endDay !== null && day > startDay && day < endDay;
    const preview = previewEnd !== null && day > startDay! && day <= previewEnd;
    const description = [rangeStart && labels.rangeStart, rangeEnd && labels.rangeEnd].filter(Boolean).join("، ");
    return {
      selected: rangeStart || rangeEnd || inRange,
      picked: rangeStart || rangeEnd,
      rangeStart,
      inRange,
      rangeEnd,
      preview,
      description: description || undefined,
    };
  };

  return (
    <CalendarCore
      {...props}
      labels={labels}
      classNames={classNames}
      preferredDays={[startDay, endDay]}
      marks={marks}
      onSelect={(day) => {
        const next = nextRange(range, dayToIso(day));
        setRange(next);
        onValueChange?.(next, rangeDetails(next));
      }}
      onPreview={setPreviewDay}
      announcement={choosingEnd ? labels.selectEnd : ""}
    />
  );
}
