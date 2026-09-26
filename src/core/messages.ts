import type { MobileInvalidReason } from "./validators/mobile";
import type { NationalIdInvalidReason } from "./validators/national-id";
import type { PlateInvalidReason } from "./validators/plate";
import type { PostalCodeInvalidReason } from "./validators/postal-code";
import type { ShebaInvalidReason } from "./validators/sheba";

export interface ValidationMessages {
  nationalId: Record<NationalIdInvalidReason, string>;
  mobile: Record<MobileInvalidReason, string>;
  sheba: Record<ShebaInvalidReason, string>;
  postalCode: Record<PostalCodeInvalidReason, string>;
  plate: Record<PlateInvalidReason, string>;
}

/**
 * Persian error messages for every validator and reason. The input components
 * show these; override them per component with the `messages` prop.
 *
 * @example validationMessages.nationalId[result.reason]
 */
export const validationMessages: ValidationMessages = {
  nationalId: {
    empty: "کد ملی را وارد کنید.",
    invalidCharacters: "کد ملی فقط باید شامل رقم باشد.",
    length: "کد ملی باید ۱۰ رقم باشد.",
    repeatedDigits: "کد ملی معتبر نیست.",
    zeroSerial: "کد ملی معتبر نیست.",
    checksum: "کد ملی معتبر نیست.",
  },
  mobile: {
    empty: "شماره موبایل را وارد کنید.",
    invalidCharacters: "شماره موبایل فقط باید شامل رقم باشد.",
    countryCode: "فقط شماره موبایل ایران پذیرفته می‌شود.",
    notMobile: "این شماره، شماره موبایل نیست.",
    length: "شماره موبایل باید ۱۱ رقم باشد.",
  },
  sheba: {
    empty: "شماره شبا را وارد کنید.",
    invalidCharacters: "شماره شبا فقط باید شامل رقم باشد.",
    country: "شماره شبا باید با IR شروع شود.",
    length: "شماره شبا باید ۲۴ رقم باشد.",
    checksum: "شماره شبا معتبر نیست.",
  },
  postalCode: {
    empty: "کد پستی را وارد کنید.",
    invalidCharacters: "کد پستی فقط باید شامل رقم باشد.",
    length: "کد پستی باید ۱۰ رقم باشد.",
    repeatedDigits: "کد پستی معتبر نیست.",
    pattern: "کد پستی معتبر نیست.",
  },
  plate: {
    empty: "شماره پلاک را وارد کنید.",
    format: "شماره پلاک کامل یا درست نیست.",
    letter: "حرف پلاک معتبر نیست.",
    region: "کد استان پلاک معتبر نیست.",
    zeroDigit: "شماره پلاک نباید رقم صفر داشته باشد.",
  },
};
