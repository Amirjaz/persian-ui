import { jalaliMonthLength, toGregorian, toJalali, type JalaliDate } from "@amirjaz/persian-ui/core";

/** A month of the Jalali calendar. `month` is 1-based (1 = فروردین). */
export interface JalaliMonth {
  year: number;
  month: number;
}

/**
 * Calendar days are handled as "day numbers" (days since 1970-01-01, UTC).
 * All arithmetic is plain integer math, so daylight-saving transitions can
 * never skip or repeat a day (the bug adding 24 hours to a local Date has).
 */
const DAY_MS = 86_400_000;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

export function isoToDay(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY_MS;
}

export function dayToIso(day: number): string {
  const date = new Date(day * DAY_MS);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Today's calendar day in the user's time zone. */
export function todayIso(now: Date = new Date()): string {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Day of the Iranian week: 0 = Saturday … 6 = Friday. */
export function persianWeekday(day: number): number {
  // 1970-01-01 was a Thursday (index 5).
  return (((day + 5) % 7) + 7) % 7;
}

/** Column of a day in a week that starts on Saturday (6) or Sunday (0). */
export function weekColumn(day: number, weekStartsOn: 0 | 6): number {
  const weekday = persianWeekday(day);
  return weekStartsOn === 6 ? weekday : (weekday + 6) % 7;
}

export function monthOf(iso: string): JalaliMonth {
  const { year, month } = toJalali(iso);
  return { year, month };
}

export function addMonths({ year, month }: JalaliMonth, delta: number): JalaliMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function compareMonths(a: JalaliMonth, b: JalaliMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** The same day of the month `delta` months later, clamped to the month's length. */
export function shiftMonths(day: number, delta: number): number {
  const jalali = toJalali(dayToIso(day));
  const target = addMonths(jalali, delta);
  const clamped = Math.min(jalali.day, jalaliMonthLength(target.year, target.month));
  return isoToDay(toGregorian({ ...target, day: clamped }));
}

export function firstDayOf(month: JalaliMonth): number {
  return isoToDay(toGregorian({ ...month, day: 1 }));
}

export function lastDayOf(month: JalaliMonth): number {
  return firstDayOf(month) + jalaliMonthLength(month.year, month.month) - 1;
}

export interface GridDay {
  /** Day number (days since 1970-01-01). */
  day: number;
  iso: string;
  jalali: JalaliDate;
  inMonth: boolean;
}

/** Six weeks of seven days covering `month`, including days from the months around it. */
export function buildMonthGrid(month: JalaliMonth, weekStartsOn: 0 | 6): GridDay[][] {
  const first = firstDayOf(month);
  const start = first - weekColumn(first, weekStartsOn);
  const weeks: GridDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: GridDay[] = [];
    for (let column = 0; column < 7; column += 1) {
      const day = start + week * 7 + column;
      const iso = dayToIso(day);
      const jalali = toJalali(iso);
      days.push({ day, iso, jalali, inMonth: jalali.year === month.year && jalali.month === month.month });
    }
    weeks.push(days);
  }
  return weeks;
}

/** The local-midnight `Date` of a calendar day. */
export function isoToLocalDate(iso: string): Date {
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}
