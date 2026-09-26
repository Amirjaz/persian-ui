/*!
 * Jalali ⇄ Gregorian day-number conversion, ported from jalaali-js v2.0.1
 * (https://github.com/jalaali/jalaali-js), which implements the algorithm from
 * Kazimierz M. Borkowski, "The Persian calendar for 3000 years" (1996).
 * Exact for Jalali years -61 … 3177.
 *
 * MIT License
 *
 * Copyright (c) 2020 Behrang Norouzinia
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** Jalali years that start a new leap cycle in Borkowski's table. */
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
  2394, 2456, 3178,
] as const;

export const MIN_JALALI_YEAR = -61;
export const MAX_JALALI_YEAR = 3177;

export interface YmdDate {
  year: number;
  month: number;
  day: number;
}

interface JalaliYearInfo {
  /** Gregorian year in which the Jalali year starts. */
  gy: number;
  /** Day of March (Gregorian) that is 1 Farvardin. */
  march: number;
  /** Years since the last leap year; 0 means this year is leap. */
  leap: number;
}

export function isSupportedJalaliYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_JALALI_YEAR && year <= MAX_JALALI_YEAR;
}

export function jalaliYearInfo(jy: number): JalaliYearInfo {
  if (!isSupportedJalaliYear(jy)) {
    throw new RangeError(
      `Invalid Jalali year ${jy}: must be an integer from ${MIN_JALALI_YEAR} to ${MAX_JALALI_YEAR}`,
    );
  }

  const gy = jy + 621;
  let leapJ = -14;
  let jp: number = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i += 1) {
    const next = BREAKS[i]!;
    jump = next - jp;
    if (jy < next) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = next;
  }
  let n = jy - jp;

  // Leap years since AD 621 up to the start of `jy`, in both calendars.
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { gy, march, leap };
}

/** Julian Day Number of a Jalali date. Inputs must be a valid date. */
export function jalaliToDayNumber(jy: number, jm: number, jd: number): number {
  const { gy, march } = jalaliYearInfo(jy);
  return gregorianToDayNumber(gy, 3, march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

const FIRST_DAY_NUMBER = jalaliToDayNumber(MIN_JALALI_YEAR, 1, 1);
// 3177 is not a leap year, so Esfand has 29 days.
const LAST_DAY_NUMBER = jalaliToDayNumber(MAX_JALALI_YEAR, 12, 29);

/** Jalali date of a Julian Day Number. */
export function dayNumberToJalali(jdn: number): YmdDate {
  if (jdn < FIRST_DAY_NUMBER || jdn > LAST_DAY_NUMBER) {
    throw new RangeError(
      `Date is outside the supported Jalali years ${MIN_JALALI_YEAR} to ${MAX_JALALI_YEAR}`,
    );
  }

  // In the last supported year the Gregorian year runs one ahead; clamp before looking it up.
  let year = Math.min(dayNumberToGregorian(jdn).year - 621, MAX_JALALI_YEAR);
  const info = jalaliYearInfo(year);
  let k = jdn - gregorianToDayNumber(info.gy, 3, info.march); // days since 1 Farvardin

  if (k >= 0) {
    if (k <= 185) return { year, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    k -= 186;
  } else {
    // The day belongs to the previous Jalali year.
    year -= 1;
    k += 179;
    if (info.leap === 1) k += 1;
  }
  return { year, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

/** Julian Day Number of a (proleptic) Gregorian date. */
export function gregorianToDayNumber(gy: number, gm: number, gd: number): number {
  const d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

/** Gregorian date of a Julian Day Number. */
export function dayNumberToGregorian(jdn: number): YmdDate {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const day = div(mod(i, 153), 5) + 1;
  const month = mod(div(i, 153), 12) + 1;
  const year = div(j, 1461) - 100100 + div(8 - month, 6);
  return { year, month, day };
}

/** Truncating integer division, as the reference algorithm uses. */
function div(a: number, b: number): number {
  return ~~(a / b);
}

/** Truncated remainder (sign follows `a`), as the reference algorithm uses. */
function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}
