import {
  validateNationalId,
  validationMessages,
  type NationalIdInvalidReason,
  type NationalIdResult,
} from "@amirjaz/persian-ui/core";
import { forwardRef } from "react";
import { digitGroupsMask } from "../field/mask";
import { ValidatedInput, type ValidatedInputConfig, type ValidatedInputProps } from "../field/ValidatedInput";

export type NationalIdInputProps = ValidatedInputProps<NationalIdResult, NationalIdInvalidReason>;

const config: ValidatedInputConfig<NationalIdResult, NationalIdInvalidReason> = {
  className: "pui-national-id-input",
  // Printed on the card as xxx-xxxxxx-x.
  mask: digitGroupsMask([3, 6, 1], "-"),
  validate: (value) => validateNationalId(value),
  defaultMessages: validationMessages.nationalId,
  isComplete: (value) => value.length === 10,
  inputMode: "numeric",
  autoComplete: "off",
};

/**
 * Input for an Iranian national ID (کد ملی). Accepts any digit script, shows
 * the code as ۰۰۰-۰۰۰۰۰۰-۰ while typing, validates the checksum and shows
 * Persian errors. The value is the 10 digits in Latin script.
 */
export const NationalIdInput = forwardRef<HTMLInputElement, NationalIdInputProps>(
  function NationalIdInput(props, ref) {
    return <ValidatedInput {...props} config={config} inputRef={ref} />;
  },
);
