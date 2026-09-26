export type { Digits, ValidationResult } from "./types";

export { toEnglishDigits, toPersianDigits } from "./digits";
export type { DigitInput } from "./digits";

export { normalizePersian } from "./normalize";
export type { NormalizeMode, NormalizeOptions } from "./normalize";

export { formatRial, formatToman } from "./money";
export type { MoneyAmount, MoneyFormatOptions } from "./money";

export {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  formatJalali,
  isLeapJalaliYear,
  isValidJalaliDate,
  jalaliMonthLength,
  parseJalali,
  toGregorian,
  toJalali,
} from "./jalali";
export type { FormatJalaliOptions, JalaliDate } from "./jalali";

export { validateNationalId } from "./validators/national-id";
export type {
  NationalIdInvalidReason,
  NationalIdOptions,
  NationalIdResult,
} from "./validators/national-id";

export { validateIranianMobile } from "./validators/mobile";
export type { MobileInvalidReason, MobileOperator, MobileResult } from "./validators/mobile";

export { validateSheba } from "./validators/sheba";
export type { ShebaInvalidReason, ShebaResult } from "./validators/sheba";

export { validatePostalCode } from "./validators/postal-code";
export type {
  PostalCodeInvalidReason,
  PostalCodeOptions,
  PostalCodeResult,
} from "./validators/postal-code";

export { PLATE_LETTERS, validatePlate } from "./validators/plate";
export type {
  PlateInvalidReason,
  PlateLetter,
  PlateOptions,
  PlateParts,
  PlateResult,
} from "./validators/plate";

export { validationMessages } from "./messages";
export type { ValidationMessages } from "./messages";
