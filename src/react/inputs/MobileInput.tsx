import {
  validateIranianMobile,
  validationMessages,
  type MobileInvalidReason,
  type MobileResult,
} from "@amirjaz/persian-ui/core";
import { forwardRef } from "react";
import { groupDigits, isDigit } from "../field/mask";
import { ValidatedInput, type ValidatedInputConfig, type ValidatedInputProps } from "../field/ValidatedInput";

export type MobileInputProps = ValidatedInputProps<MobileResult, MobileInvalidReason>;

/**
 * Turns international forms into the national one once complete:
 * 0098 9xx… (14 digits) and 98 9xx… (12 digits) become 09xx…
 */
function sanitizeMobile(value: string): string {
  let national: string;
  if (value.startsWith("0098")) {
    if (value.length < 14) return value;
    national = value.slice(4);
  } else if (value.startsWith("98")) {
    if (value.length < 12) return value;
    national = value.slice(2);
  } else {
    return value.slice(0, 11);
  }
  // The trunk zero after the country code is optional: "+98 0912…" is common.
  return (national.startsWith("0") ? national : `0${national}`).slice(0, 11);
}

const config: ValidatedInputConfig<MobileResult, MobileInvalidReason> = {
  className: "pui-mobile-input",
  mask: {
    accept: isDigit,
    sanitize: sanitizeMobile,
    format: (value) => groupDigits(value, [4, 3, 4], " "),
  },
  validate: (value) => validateIranianMobile(value),
  defaultMessages: validationMessages.mobile,
  // 11 digits in the national form; "0098…" is still being typed at 11 digits.
  isComplete: (value) => value.length === 11 && !value.startsWith("00"),
  inputMode: "tel",
  autoComplete: "tel",
  type: "tel",
};

/**
 * Input for an Iranian mobile number. Accepts any digit script and pasted
 * +98 / 0098 numbers, shows ۰۹۱۲ ۳۴۵ ۶۷۸۹ while typing and validates it.
 * The value is the national form in Latin digits, e.g. "09121234567";
 * `onValueChange` also receives the detected operator.
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(function MobileInput(props, ref) {
  return <ValidatedInput {...props} config={config} inputRef={ref} />;
});
