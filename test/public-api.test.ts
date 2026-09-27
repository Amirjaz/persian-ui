import { describe, expect, it } from "vitest";
import * as core from "@amirjaz/persian-ui/core";

describe("@amirjaz/persian-ui/core", () => {
  it("exports exactly the documented API", () => {
    expect(Object.keys(core).sort()).toEqual([
      "IRANIAN_BANKS",
      "JALALI_MONTH_NAMES",
      "PERSIAN_WEEKDAY_NAMES",
      "PLATE_LETTERS",
      "fixKeyboardLayout",
      "formatJalali",
      "formatRial",
      "formatToman",
      "getBankFromCardNumber",
      "getBankFromSheba",
      "isLeapJalaliYear",
      "isValidJalaliDate",
      "jalaliMonthLength",
      "normalizePersian",
      "numberToWords",
      "parseJalali",
      "toEnglishDigits",
      "toGregorian",
      "toJalali",
      "toPersianDigits",
      "validateCardNumber",
      "validateIranianMobile",
      "validateNationalId",
      "validatePlate",
      "validatePostalCode",
      "validateSheba",
      "validationMessages",
    ]);
  });
});
