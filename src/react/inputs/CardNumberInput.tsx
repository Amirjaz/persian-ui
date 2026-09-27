import {
  getBankFromCardNumber,
  validateCardNumber,
  validationMessages,
  type CardNumberInvalidReason,
  type CardNumberResult,
} from "@amirjaz/persian-ui/core";
import { forwardRef } from "react";
import { digitGroupsMask } from "../field/mask";
import {
  ValidatedInput,
  type BankInputProps,
  type ValidatedInputConfig,
  type ValidatedInputProps,
} from "../field/ValidatedInput";

export type CardNumberInputProps = ValidatedInputProps<CardNumberResult, CardNumberInvalidReason> & BankInputProps;

const config: ValidatedInputConfig<CardNumberResult, CardNumberInvalidReason> = {
  className: "pui-card-number-input",
  // Printed on the card as four groups of four.
  mask: digitGroupsMask([4, 4, 4, 4], " "),
  validate: (value) => validateCardNumber(value),
  defaultMessages: validationMessages.card,
  isComplete: (value) => value.length === 16,
  inputMode: "numeric",
  autoComplete: "cc-number",
  detectBank: (value) => getBankFromCardNumber(value),
};

/**
 * Input for an Iranian bank card number (Shetab). Accepts any digit script,
 * shows ۶۰۳۷ ۹۹۱۲ … in groups of four, checks the Luhn checksum and names the
 * bank as soon as the first six digits are in (`showBank`). The value is the
 * 16 digits in Latin script; `onValueChange` also receives `result.bank`.
 */
export const CardNumberInput = forwardRef<HTMLInputElement, CardNumberInputProps>(
  function CardNumberInput(props, ref) {
    return <ValidatedInput {...props} config={config} inputRef={ref} />;
  },
);
