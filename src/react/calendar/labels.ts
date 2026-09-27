/** Texts used by the calendar and date picker; all can be overridden with `labels`. */
export interface CalendarLabels {
  /** Accessible name of the day grid when the calendar has no visible label. */
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  /** Appended to a holiday's accessible name, e.g. «جمعه ۱ فروردین ۱۴۰۴، تعطیل: نوروز». */
  holiday: string;
}

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  calendar: "تقویم",
  previousMonth: "ماه قبل",
  nextMonth: "ماه بعد",
  month: "ماه",
  year: "سال",
  holiday: "تعطیل",
};

/** Gregorian month names as written in Persian. */
export const GREGORIAN_MONTH_NAMES = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
] as const;

/** Texts used by the range calendar and range picker, on top of the calendar's. */
export interface RangeCalendarLabels extends CalendarLabels {
  /** Appended to the start day's accessible name. */
  rangeStart: string;
  /** Appended to the end day's accessible name. */
  rangeEnd: string;
  /** Announced once the start is picked. */
  selectEnd: string;
}

export const DEFAULT_RANGE_CALENDAR_LABELS: RangeCalendarLabels = {
  ...DEFAULT_CALENDAR_LABELS,
  rangeStart: "آغاز بازه",
  rangeEnd: "پایان بازه",
  selectEnd: "تاریخ پایان را انتخاب کنید.",
};
