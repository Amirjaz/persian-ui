import {
  validateSheba,
  validationMessages,
  type ShebaInvalidReason,
  type ShebaResult,
} from "@amirjaz/persian-ui/core";
import { forwardRef } from "react";
import { digitGroupsMask } from "../field/mask";
import { ValidatedInput, type ValidatedInputConfig, type ValidatedInputProps } from "../field/ValidatedInput";

export type ShebaInputProps = ValidatedInputProps<ShebaResult, ShebaInvalidReason>;

const config: ValidatedInputConfig<ShebaResult, ShebaInvalidReason> = {
  className: "pui-sheba-input",
  // Groups of four counted from "IR", as printed: IR06 0170 0000 …
  mask: digitGroupsMask([2, 4, 4, 4, 4, 4, 2], " "),
  validate: (digits) => validateSheba(digits),
  defaultMessages: validationMessages.sheba,
  isComplete: (digits) => digits.length === 24,
  inputMode: "numeric",
  autoComplete: "off",
  toValue: (digits) => (digits === "" ? "" : `IR${digits}`),
  fromValue: (value) => value.replace(/^IR/i, ""),
  // "IR" and the digits read left to right as one unit, in any page direction.
  controlDir: "ltr",
  start: (
    <span className="pui-field__affix" aria-hidden="true">
      IR
    </span>
  ),
};

/**
 * Input for an Iranian IBAN (شماره شبا). "IR" is shown as a fixed prefix; the
 * user types or pastes the 24 digits in any script. The value is the full
 * number, e.g. "IR06…", validated with the ISO 13616 checksum.
 */
export const ShebaInput = forwardRef<HTMLInputElement, ShebaInputProps>(function ShebaInput(props, ref) {
  return <ValidatedInput {...props} config={config} inputRef={ref} />;
});
