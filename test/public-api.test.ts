import { describe, expect, it } from "vitest";
import * as core from "@amirjaz/persian-ui/core";

describe("@amirjaz/persian-ui/core", () => {
  it("exports exactly the documented API", () => {
    expect(Object.keys(core).sort()).toEqual([
      "JALALI_MONTH_NAMES",
      "PERSIAN_WEEKDAY_NAMES",
      "PLATE_LETTERS",
      "formatJalali",
      "formatRial",
      "formatToman",
      "isLeapJalaliYear",
      "isValidJalaliDate",
      "jalaliMonthLength",
      "normalizePersian",
      "parseJalali",
      "toEnglishDigits",
      "toGregorian",
      "toJalali",
      "toPersianDigits",
      "validateIranianMobile",
      "validateNationalId",
      "validatePlate",
      "validatePostalCode",
      "validateSheba",
      "validationMessages",
    ]);
  });
});
