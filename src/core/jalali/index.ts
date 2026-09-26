import { toEnglishDigits, toPersianDigits } from "../digits";
import type { Digits } from "../types";
import {
  dayNumberToGregorian,
  dayNumberToJalali,
  gregorianToDayNumber,
  isSupportedJalaliYear,
  jalaliToDayNumber,
  jalaliYearInfo,
} from "./algorithm";

/** A date in the Jalali (Shamsi) calendar. `month` is 1-based (1 = فروردین). */
export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

/** Month names, Farvardin first. */
export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Weekday names, Saturday first (the Iranian week). */
export const PERSIAN_WEEKDAY_NAMES = [
  "شنبه",
  "یک‌شنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
] as const;

export interface FormatJalaliOptions {
  /** `numeric` → «۱۴۰۴/۰۱/۱۵» (default), `long` → «۱۵ فروردین ۱۴۰۴». */
  format?: "numeric" | "long";
  /** Digit glyphs. Default `"fa"`. */
  digits?: Digits;
  /** Prefix the weekday name, e.g. «شنبه ۱۵ فروردین ۱۴۰۴». Default `false`. */
  weekday?: boolean;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TYPED_JALALI_DATE = /^(\d{4})\s*([/\-.٫])\s*(\d{1,2})\s*\2\s*(\d{1,2})$/;

/**
 * Converts a Gregorian calendar date to Jalali.
 *
 * @param date an ISO date string (`YYYY-MM-DD`), or a `Date` whose **local**
 *   calendar day is used.
 * @example toJalali("2025-03-21") // { year: 1404, month: 1, day: 1 }
 * @throws {RangeError} for malformed or impossible dates and dates outside
 *   the supported range (Jalali years -61 to 3177).
 */
export function toJalali(date: string | Date): JalaliDate {
  return dayNumberToJalali(toDayNumber(date));
}

/**
 * Converts a Jalali date to a Gregorian ISO date string (`YYYY-MM-DD`).
 *
 * @example toGregorian({ year: 1404, month: 1, day: 1 }) // "2025-03-21"
 * @throws {RangeError} if the Jalali date does not exist.
 */
export function toGregorian(date: JalaliDate): string {
  assertValidJalaliDate(date);
  const { year, month, day } = dayNumberToGregorian(
    jalaliToDayNumber(date.year, date.month, date.day),
  );
  return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

/** Whether `date` is a real Jalali date (integers, supported year, day within the month). */
export function isValidJalaliDate(date: JalaliDate): boolean {
  if (typeof date !== "object" || date === null) return false;
  const { year, month, day } = date;
  return (
    isSupportedJalaliYear(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= jalaliMonthLength(year, month)
  );
}

/**
 * Whether a Jalali year has 366 days (Esfand has 30 days).
 *
 * @throws {RangeError} for non-integer years or years outside -61 to 3177.
 */
export function isLeapJalaliYear(year: number): boolean {
  return jalaliYearInfo(year).leap === 0;
}

/**
 * Number of days in a Jalali month: 31 for months 1 to 6, 30 for 7 to 11, and 29 or
 * 30 for Esfand depending on the leap year.
 *
 * @throws {RangeError} for an invalid year or month.
 */
export function jalaliMonthLength(year: number, month: number): number {
  const { leap } = jalaliYearInfo(year); // also validates the year
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid Jalali month ${month}: must be an integer from 1 to 12`);
  }
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return leap === 0 ? 30 : 29;
}

/**
 * Formats a date in the Jalali calendar.
 *
 * @param date an ISO date string, a `Date` (local calendar day) or a Jalali date.
 * @example
 * formatJalali("2025-04-04")                      // "۱۴۰۴/۰۱/۱۵"
 * formatJalali("2025-04-04", { format: "long" })  // "۱۵ فروردین ۱۴۰۴"
 * formatJalali("2025-04-04", { weekday: true })   // "جمعه ۱۴۰۴/۰۱/۱۵"
 * @throws {RangeError} for invalid dates.
 */
export function formatJalali(
  date: string | Date | JalaliDate,
  options: FormatJalaliOptions = {},
): string {
  const { format = "numeric", digits = "fa", weekday = false } = options;
  const dayNumber =
    typeof date === "string" || date instanceof Date
      ? toDayNumber(date)
      : validJalaliDayNumber(date);
  const { year, month, day } = dayNumberToJalali(dayNumber);

  let text =
    format === "long"
      ? `${day} ${JALALI_MONTH_NAMES[month - 1]} ${year}`
      : `${year}/${pad2(month)}/${pad2(day)}`;
  if (weekday) text = `${PERSIAN_WEEKDAY_NAMES[weekdayIndex(dayNumber)]} ${text}`;
  return digits === "fa" ? toPersianDigits(text) : text;
}

/**
 * Parses a typed Jalali date such as «۱۴۰۴/۰۱/۱۵», `1404-1-5` or `١٤٠٤.٠١.١٥`.
 * Accepts any digit script and `/`, `-`, `.` or `٫` as the separator (the same
 * one twice); the year must have four digits.
 *
 * @returns the date, or `null` if the text isn't a real Jalali date.
 */
export function parseJalali(text: string): JalaliDate | null {
  if (typeof text !== "string") return null;
  const cleaned = toEnglishDigits(text).replace(/[\u061c\u200e\u200f]/g, "").trim();
  const match = TYPED_JALALI_DATE.exec(cleaned);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[3]), day: Number(match[4]) };
  return isValidJalaliDate(date) ? date : null;
}

/** Day of the Iranian week for a Julian Day Number: 0 = Saturday … 6 = Friday. */
function weekdayIndex(dayNumber: number): number {
  return (dayNumber + 2) % 7;
}

function toDayNumber(date: string | Date): number {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) throw new RangeError("Invalid Date");
    return gregorianToDayNumber(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Invalid ISO date ${JSON.stringify(date)}: expected YYYY-MM-DD`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dayNumber = gregorianToDayNumber(year, month, day);
  // Impossible dates such as 2025-02-30 don't survive the round trip.
  const roundTrip = dayNumberToGregorian(dayNumber);
  if (roundTrip.year !== year || roundTrip.month !== month || roundTrip.day !== day) {
    throw new RangeError(`Invalid ISO date ${JSON.stringify(date)}: no such day`);
  }
  return dayNumber;
}

function validJalaliDayNumber(date: JalaliDate): number {
  assertValidJalaliDate(date);
  return jalaliToDayNumber(date.year, date.month, date.day);
}

function assertValidJalaliDate(date: JalaliDate): void {
  if (!isValidJalaliDate(date)) {
    throw new RangeError(`Invalid Jalali date ${JSON.stringify(date)}`);
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
