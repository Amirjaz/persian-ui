import type { Digits, IranianBank, ValidationResult } from "@amirjaz/persian-ui/core";
import {
  useId,
  useState,
  type ChangeEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { useExplicitDirection, type Direction } from "../direction";
import { cx, useControllableState } from "../utils";
import { Field, describedBy, hasError } from "./Field";
import type { InputMask } from "./mask";
import { useMaskedInput } from "./useMaskedInput";

/** Props shared by every masked input. The remaining props go to the `<input>`. */
export interface MaskedInputBaseProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "dir" | "type" | "children" | "className"
  > {
  /** Visible label, wired to the input. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Help text below the input, announced with it. */
  hint?: ReactNode;
  /** An error to show instead of the built-in validation, e.g. from the server. */
  error?: ReactNode;
  /** Digits shown while typing. The value always uses Latin digits. Default `"fa"`. */
  digits?: Digits;
  /** Layout direction. Default: the `DirectionProvider`'s, else the page's. */
  dir?: Direction;
  /** Class name for the root element. */
  className?: string;
  /** Native change event; `event.target.value` is the formatted display text. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export interface ValidatedInputProps<TResult, TReason extends string> extends MaskedInputBaseProps {
  /** Controlled value (normalized, Latin digits). Use `""` for empty. */
  value?: string;
  defaultValue?: string;
  /** Called with the normalized value and its validation result on every change. */
  onValueChange?: (value: string, result: TResult) => void;
  /** Replace the built-in Persian error messages. */
  messages?: Partial<Record<TReason, ReactNode>>;
}

export interface ValidatedInputConfig<TResult, TReason extends string> {
  className: string;
  mask: InputMask;
  validate: (value: string) => TResult;
  defaultMessages: Record<TReason, string>;
  /** Whether the input holds a full value; errors then show without waiting for blur. */
  isComplete: (significant: string) => boolean;
  inputMode: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete: string;
  type?: "text" | "tel";
  /** Maps the significant characters to the public value, e.g. adds "IR". */
  toValue?: (significant: string) => string;
  fromValue?: (value: string) => string;
  controlDir?: Direction;
  start?: ReactNode;
  /** Finds the bank from a partial value; enables the `showBank` prop. */
  detectBank?: (significant: string) => IranianBank | null;
}

/** For inputs that can name the bank (cards, Sheba). */
export interface BankInputProps {
  /**
   * Show the bank's name at the end of the field as soon as the number tells it,
   * and set `data-bank` (the bank's id) on the root for styling. Default `true`.
   */
  showBank?: boolean;
}

const identity = (value: string) => value;

export function ValidatedInput<TResult extends ValidationResult<object, TReason>, TReason extends string>({
  config,
  inputRef,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onChange,
  onBlur,
  label,
  hint,
  error,
  messages,
  digits = "fa",
  dir,
  className,
  id,
  name,
  required,
  disabled,
  autoComplete,
  showBank = true,
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: ValidatedInputProps<TResult, TReason> &
  BankInputProps & {
    config: ValidatedInputConfig<TResult, TReason>;
    inputRef: Ref<HTMLInputElement>;
  }) {
  const { toValue = identity, fromValue = identity } = config;
  const explicitDir = useExplicitDirection(dir);
  const generatedId = useId();
  const ids = {
    inputId: id ?? `${generatedId}-input`,
    hintId: `${generatedId}-hint`,
    errorId: `${generatedId}-error`,
  };
  const bankId = `${generatedId}-bank`;
  const [value, setValue] = useControllableState(valueProp, defaultValue);
  const [touched, setTouched] = useState(false);
  const significant = fromValue(value);

  const { display, handleChange } = useMaskedInput({
    value: significant,
    mask: config.mask,
    digits,
    onChange,
    onValueChange: (next) => {
      const nextValue = toValue(next);
      setValue(nextValue);
      onValueChange?.(nextValue, config.validate(next));
    },
  });

  const result = config.validate(significant);
  const reason = result.valid ? undefined : (result as { reason: TReason }).reason;
  const shouldValidate =
    significant === "" ? touched && Boolean(required) : touched || config.isComplete(significant);
  const message = hasError(error)
    ? error
    : shouldValidate && reason !== undefined
      ? (messages?.[reason] ?? config.defaultMessages[reason])
      : null;
  const invalid = hasError(message);
  const bank = showBank && config.detectBank ? config.detectBank(significant) : null;

  return (
    <Field
      ids={ids}
      label={label}
      hint={hint}
      error={message}
      dir={explicitDir}
      className={cx(config.className, className)}
      controlDir={config.controlDir}
      start={config.start}
      end={
        bank && (
          <span id={bankId} className="pui-field__affix pui-field__bank" dir="rtl">
            {bank.name}
          </span>
        )
      }
      data={{ "data-bank": bank?.id }}
      name={name}
      submitValue={value}
      disabled={disabled}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={ids.inputId}
        type={config.type ?? "text"}
        dir="ltr"
        inputMode={config.inputMode}
        autoComplete={autoComplete ?? config.autoComplete}
        className="pui-field__input"
        value={display}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={
          [ariaDescribedBy, bank ? bankId : null, describedBy(ids, hint, message)].filter(Boolean).join(" ") ||
          undefined
        }
        onChange={handleChange}
        onBlur={(event) => {
          setTouched(true);
          onBlur?.(event);
        }}
      />
    </Field>
  );
}
