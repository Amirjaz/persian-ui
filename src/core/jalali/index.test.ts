import fc from "fast-check";
import * as oracle from "jalaali-js";
import { describe, expect, it } from "vitest";
import {
  ARABIC_DECIMAL_SEPARATOR,
  ARABIC_KAF,
  ARABIC_YEH,
  LRM,
  RLM,
  arabicIndic,
  fa,
} from "../../../test/chars";
import {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  formatJalali,
  isLeapJalaliYear,
  isValidJalaliDate,
  jalaliMonthLength,
  parseJalali,
  toGregorian,
  toJalali,
  type JalaliDate,
} from "./index";

const pad = (value: number, length = 2) => String(value).padStart(length, "0");
const iso = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
const jalali = (year: number, month: number, day: number): JalaliDate => ({ year, month, day });

describe("toJalali", () => {
  it("converts known Nowruz dates", () => {
    expect(toJalali("2024-03-20")).toEqual(jalali(1403, 1, 1));
    expect(toJalali("2025-03-20")).toEqual(jalali(1403, 12, 30)); // 1403 is a leap year
    expect(toJalali("2025-03-21")).toEqual(jalali(1404, 1, 1));
    expect(toJalali("2026-03-21")).toEqual(jalali(1405, 1, 1));
  });

  it("reads a Date's local calendar day", () => {
    expect(toJalali(new Date(2025, 2, 21, 0, 0))).toEqual(jalali(1404, 1, 1));
    expect(toJalali(new Date(2025, 2, 21, 23, 59))).toEqual(jalali(1404, 1, 1));
  });

  it("rejects malformed and impossible dates", () => {
    const bad = ["2025-02-30", "2025-02-29", "2025-12-32", "2025-13-01", "2025-3-21", "21/03/2025", "", "2025-03-21T00:00:00Z"];
    for (const input of bad) expect(() => toJalali(input)).toThrow(RangeError);
    expect(() => toJalali(new Date(Number.NaN))).toThrow(RangeError);
  });

  it("rejects dates outside the supported range", () => {
    expect(() => toJalali("0500-01-01")).toThrow(RangeError);
    expect(() => toJalali("3800-01-01")).toThrow(RangeError);
  });
});

describe("toGregorian", () => {
  it("converts to ISO dates", () => {
    expect(toGregorian(jalali(1404, 1, 1))).toBe("2025-03-21");
    expect(toGregorian(jalali(1403, 12, 30))).toBe("2025-03-20");
  });

  it("zero-pads years before 1000", () => {
    const { gy, gm, gd } = oracle.toGregorian(1, 1, 1);
    expect(toGregorian(jalali(1, 1, 1))).toBe(iso(gy, gm, gd));
    expect(toGregorian(jalali(1, 1, 1))).toMatch(/^0\d{3}-/);
  });

  it("rejects dates that don't exist", () => {
    for (const date of [jalali(1404, 12, 30), jalali(1404, 0, 1), jalali(1404, 1, 32), jalali(3178, 1, 1)]) {
      expect(() => toGregorian(date)).toThrow(RangeError);
    }
  });
});

describe("isValidJalaliDate", () => {
  it("accepts real dates", () => {
    expect(isValidJalaliDate(jalali(1403, 12, 30))).toBe(true);
    expect(isValidJalaliDate(jalali(1404, 7, 30))).toBe(true);
  });

  it("rejects impossible dates and non-integers", () => {
    const bad = [
      jalali(1404, 12, 30),
      jalali(1404, 13, 1),
      jalali(1404, 0, 1),
      jalali(1404, 1, 0),
      jalali(1404, 1, 32),
      jalali(1404, 7, 31),
      jalali(1404, 1.5, 1),
      jalali(1404, 1, 1.5),
      jalali(1404.5, 1, 1),
      jalali(-62, 1, 1),
      jalali(3178, 1, 1),
    ];
    for (const date of bad) expect(isValidJalaliDate(date)).toBe(false);
  });

  it("returns false for things that aren't dates", () => {
    for (const value of [null, undefined, "1404/01/01", 1404]) {
      expect(isValidJalaliDate(value as unknown as JalaliDate)).toBe(false);
    }
  });
});

describe("isLeapJalaliYear and jalaliMonthLength", () => {
  it("knows recent leap years", () => {
    expect([1399, 1403, 1408].map(isLeapJalaliYear)).toEqual([true, true, true]);
    expect([1400, 1401, 1402, 1404, 1405].map(isLeapJalaliYear)).toEqual([false, false, false, false, false]);
  });

  it("gives month lengths", () => {
    for (let month = 1; month <= 6; month += 1) expect(jalaliMonthLength(1404, month)).toBe(31);
    for (let month = 7; month <= 11; month += 1) expect(jalaliMonthLength(1404, month)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
  });

  it("has a 29-day Esfand in the last supported year", () => {
    expect(isLeapJalaliYear(3177)).toBe(false);
    expect(jalaliMonthLength(3177, 12)).toBe(29);
    const lastDay = toGregorian(jalali(3177, 12, 29));
    expect(toJalali(lastDay)).toEqual(jalali(3177, 12, 29));
  });

  it("rejects invalid years and months", () => {
    for (const year of [1403.5, -62, 3178, Number.NaN]) {
      expect(() => isLeapJalaliYear(year)).toThrow(RangeError);
      expect(() => jalaliMonthLength(year, 1)).toThrow(RangeError);
    }
    for (const month of [0, 13, 1.5]) expect(() => jalaliMonthLength(1404, month)).toThrow(RangeError);
  });
});

describe("formatJalali", () => {
  it("formats numerically with Persian digits by default", () => {
    expect(formatJalali("2025-04-04")).toBe(fa("1404/01/15"));
    expect(formatJalali("2025-04-04", { digits: "en" })).toBe("1404/01/15");
  });

  it("formats with the month name", () => {
    expect(formatJalali("2025-04-04", { format: "long" })).toBe(
      `${fa("15")} ${JALALI_MONTH_NAMES[0]} ${fa("1404")}`,
    );
  });

  it("can prefix the weekday", () => {
    // 1 Farvardin 1404 was a Friday.
    expect(formatJalali("2025-03-21", { weekday: true, format: "long", digits: "en" })).toBe(
      `${PERSIAN_WEEKDAY_NAMES[6]} 1 ${JALALI_MONTH_NAMES[0]} 1404`,
    );
    expect(formatJalali("2025-03-21", { weekday: true, digits: "en" })).toBe(
      `${PERSIAN_WEEKDAY_NAMES[6]} 1404/01/01`,
    );
  });

  it("accepts ISO strings, Dates and Jalali dates alike", () => {
    const expected = formatJalali("2025-04-04");
    expect(formatJalali(new Date(2025, 3, 4))).toBe(expected);
    expect(formatJalali(jalali(1404, 1, 15))).toBe(expected);
  });

  it("rejects invalid dates", () => {
    expect(() => formatJalali(jalali(1404, 12, 30))).toThrow(RangeError);
    expect(() => formatJalali("2025-02-30")).toThrow(RangeError);
  });

  it("names the right weekday for any day", () => {
    const days = fc.integer({ min: Date.UTC(1900, 0, 1), max: Date.UTC(2200, 0, 1) }).map((ms) => {
      const date = new Date(ms);
      return { iso: iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()), weekday: date.getUTCDay() };
    });
    fc.assert(
      fc.property(days, ({ iso: isoDate, weekday }) => {
        const name = formatJalali(isoDate, { weekday: true }).split(" ")[0];
        // getUTCDay: 0 = Sunday … 6 = Saturday; the Iranian week starts on Saturday.
        expect(name).toBe(PERSIAN_WEEKDAY_NAMES[(weekday + 1) % 7]);
      }),
    );
  });
});

describe("parseJalali", () => {
  it("parses dates typed with any digits and separator", () => {
    const inputs = [
      fa("1404/01/15"),
      "1404/1/15",
      arabicIndic("1404.01.15"),
      "1404-01-15",
      `1404${ARABIC_DECIMAL_SEPARATOR}01${ARABIC_DECIMAL_SEPARATOR}15`,
      " 1404 / 01 / 15 ",
      `${LRM}1404/01/15${RLM}`,
    ];
    for (const input of inputs) expect(parseJalali(input)).toEqual(jalali(1404, 1, 15));
    expect(parseJalali("1403/12/30")).toEqual(jalali(1403, 12, 30));
  });

  it("returns null for anything that isn't a real date", () => {
    const bad = ["1404/12/30", "1404/13/01", "1404/01/32", "1404/01-15", "04/01/15", "14040115", "", "abc"];
    for (const input of bad) expect(parseJalali(input)).toBeNull();
    expect(parseJalali(1404 as unknown as string)).toBeNull();
  });
});

describe("names", () => {
  it("has twelve months and seven weekdays, Saturday first", () => {
    expect(JALALI_MONTH_NAMES).toHaveLength(12);
    expect(PERSIAN_WEEKDAY_NAMES).toHaveLength(7);
  });

  it("uses Persian yeh and kaf, not the Arabic ones", () => {
    const arabicLetters = new RegExp(`[${ARABIC_YEH}${ARABIC_KAF}]`);
    for (const name of [...JALALI_MONTH_NAMES, ...PERSIAN_WEEKDAY_NAMES]) expect(name).not.toMatch(arabicLetters);
  });
});

describe("agreement with reference implementations", () => {
  it("matches jalaali-js on every day from 1200 to 1600", () => {
    for (let year = 1200; year <= 1600; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const length = oracle.jalaaliMonthLength(year, month);
        expect(jalaliMonthLength(year, month)).toBe(length);
        for (let day = 1; day <= length; day += 1) {
          const { gy, gm, gd } = oracle.toGregorian(year, month, day);
          const gregorian = iso(gy, gm, gd);
          if (toGregorian(jalali(year, month, day)) !== gregorian) {
            expect(toGregorian(jalali(year, month, day))).toBe(gregorian);
          }
          const back = toJalali(gregorian);
          if (back.year !== year || back.month !== month || back.day !== day) {
            expect(back).toEqual(jalali(year, month, day));
          }
        }
      }
    }
  });

  it("matches jalaali-js on the first and last day of every supported year", () => {
    for (let year = -61; year <= 3177; year += 1) {
      expect(isLeapJalaliYear(year)).toBe(oracle.isLeapJalaaliYear(year));
      const lastDay = oracle.jalaaliMonthLength(year, 12);
      for (const [month, day] of [[1, 1], [12, lastDay]] as const) {
        const { gy, gm, gd } = oracle.toGregorian(year, month, day);
        expect(toGregorian(jalali(year, month, day))).toBe(iso(gy, gm, gd));
        expect(toJalali(iso(gy, gm, gd))).toEqual(jalali(year, month, day));
      }
    }
  });

  it("matches the platform's ICU Persian calendar from 1300 to 1500", () => {
    const icu = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const start = Date.UTC(1921, 2, 21); // 1 Farvardin 1300
    const end = Date.UTC(2122, 2, 21); // 1 Farvardin 1501
    for (let ms = start; ms < end; ms += 86_400_000) {
      const date = new Date(ms);
      const parts = Object.fromEntries(icu.formatToParts(date).map((part) => [part.type, part.value]));
      const expected = jalali(Number(parts.year), Number(parts.month), Number(parts.day));
      const actual = toJalali(iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()));
      if (actual.year !== expected.year || actual.month !== expected.month || actual.day !== expected.day) {
        expect(actual).toEqual(expected);
      }
    }
  });
});
