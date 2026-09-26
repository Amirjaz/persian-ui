import type { JalaliDate } from "@amirjaz/persian-ui/core";

interface SolarHoliday {
  month: number;
  day: number;
  title: string;
}

interface LunarHoliday {
  hijriMonth: number;
  hijriDay: number;
  title: string;
}

/** Iranian public holidays on fixed Jalali dates. */
const SOLAR_HOLIDAYS: readonly SolarHoliday[] = [
  { month: 1, day: 1, title: "نوروز" },
  { month: 1, day: 2, title: "نوروز" },
  { month: 1, day: 3, title: "نوروز" },
  { month: 1, day: 4, title: "نوروز" },
  { month: 1, day: 12, title: "روز جمهوری اسلامی ایران" },
  { month: 1, day: 13, title: "روز طبیعت" },
  { month: 3, day: 14, title: "رحلت امام خمینی" },
  { month: 3, day: 15, title: "قیام ۱۵ خرداد" },
  { month: 11, day: 22, title: "پیروزی انقلاب اسلامی" },
  { month: 12, day: 29, title: "ملی شدن صنعت نفت" },
];

/** Iranian public holidays on lunar Hijri dates. */
const LUNAR_HOLIDAYS: readonly LunarHoliday[] = [
  { hijriMonth: 1, hijriDay: 9, title: "تاسوعای حسینی" },
  { hijriMonth: 1, hijriDay: 10, title: "عاشورای حسینی" },
  { hijriMonth: 2, hijriDay: 20, title: "اربعین حسینی" },
  { hijriMonth: 2, hijriDay: 28, title: "رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)" },
  { hijriMonth: 2, hijriDay: 30, title: "شهادت امام رضا (ع)" },
  { hijriMonth: 3, hijriDay: 17, title: "میلاد رسول اکرم (ص) و امام جعفر صادق (ع)" },
  { hijriMonth: 7, hijriDay: 27, title: "مبعث رسول اکرم (ص)" },
  { hijriMonth: 8, hijriDay: 15, title: "میلاد امام مهدی (عج)" },
  { hijriMonth: 9, hijriDay: 21, title: "شهادت امام علی (ع)" },
  { hijriMonth: 10, hijriDay: 1, title: "عید فطر" },
  { hijriMonth: 10, hijriDay: 25, title: "شهادت امام جعفر صادق (ع)" },
  { hijriMonth: 12, hijriDay: 10, title: "عید قربان" },
  { hijriMonth: 12, hijriDay: 18, title: "عید غدیر خم" },
];

/** Julian Day Number of 1970-01-01. */
const UNIX_EPOCH_JDN = 2440588;
const ISLAMIC_EPOCH_JDN = 1948440;

/**
 * Tabular (civil) Hijri month and day for a day number (days since 1970-01-01).
 * This is the arithmetic calendar (identical to ICU's "islamic-civil"); the
 * officially announced moon-sighting dates can differ by a day, so lunar
 * holidays may be a day early or late.
 */
export function toHijri(day: number): { month: number; day: number } {
  let n = day + UNIX_EPOCH_JDN - ISLAMIC_EPOCH_JDN + 10632;
  const cycle = Math.floor((n - 1) / 10631);
  n = n - 10631 * cycle + 354;
  const j1 =
    Math.floor((10985 - n) / 5316) * Math.floor((50 * n) / 17719) +
    Math.floor(n / 5670) * Math.floor((43 * n) / 15238);
  n =
    n -
    Math.floor((30 - j1) / 15) * Math.floor((17719 * j1) / 50) -
    Math.floor(j1 / 16) * Math.floor((15238 * j1) / 43) +
    29;
  const month = Math.floor((24 * n) / 709);
  return { month, day: n - Math.floor((709 * month) / 24) };
}

/** The holiday on a day, if any. */
export function holidayOn(day: number, jalali: JalaliDate): string | undefined {
  const solar = SOLAR_HOLIDAYS.find((holiday) => holiday.month === jalali.month && holiday.day === jalali.day);
  if (solar) return solar.title;
  const hijri = toHijri(day);
  return LUNAR_HOLIDAYS.find((holiday) => holiday.hijriMonth === hijri.month && holiday.hijriDay === hijri.day)
    ?.title;
}
