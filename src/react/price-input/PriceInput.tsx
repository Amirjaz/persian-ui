import { numberToWords, type Digits } from "@amirjaz/persian-ui/core";
import { forwardRef, useId, useRef, useState, type KeyboardEvent } from "react";
import { getDirection, useExplicitDirection } from "../direction";
import { Field, describedBy, hasError } from "../field/Field";
import { isDigit, type InputMask } from "../field/mask";
import { useMaskedInput } from "../field/useMaskedInput";
import type { MaskedInputBaseProps } from "../field/ValidatedInput";
import { cx, useControllableState } from "../utils";

export type PriceUnit = "toman" | "rial";

export interface PriceChangeDetails {
  /** The same amount in rial (always a whole number), or `null` when empty. */
  rial: number | null;
  /** The unit the user is typing in. */
  unit: PriceUnit;
}

export interface PriceInputLabels {
  toman: string;
  rial: string;
  /** Accessible name of the unit switch. */
  unit: string;
}

export interface PriceInputProps extends MaskedInputBaseProps {
  /** Controlled amount **in toman**; `null` when empty. */
  value?: number | null;
  defaultValue?: number | null;
  /** Called with the amount in toman on every change. */
  onValueChange?: (toman: number | null, details: PriceChangeDetails) => void;
  /** The unit the user types in (controlled). */
  unit?: PriceUnit;
  /** Initial unit when uncontrolled. Default `"toman"`. */
  defaultUnit?: PriceUnit;
  onUnitChange?: (unit: PriceUnit) => void;
  /** Show the toman/rial switch. Default `true`. */
  showUnitToggle?: boolean;
  /**
   * Show the amount in words under the field, in the unit being typed:
   * «یک میلیون و پانصد هزار تومان». Default `false`.
   */
  showWords?: boolean;
  labels?: Partial<PriceInputLabels>;
}

const DEFAULT_LABELS: PriceInputLabels = { toman: "تومان", rial: "ریال", unit: "واحد پول" };
const UNITS: readonly PriceUnit[] = ["toman", "rial"];
/** 15 digits of rial stay below Number.MAX_SAFE_INTEGER. */
const MAX_RIAL_DIGITS = 15;

/** Amount mask: whole rials, or toman with at most one decimal (a toman is 10 rials). */
function amountMask(unit: PriceUnit): InputMask {
  const decimals = unit === "toman";
  return {
    normalize: (text) => text.replace(/٫/g, "."),
    accept: (char) => isDigit(char) || (decimals && char === "."),
    sanitize: (value) => {
      const point = value.indexOf(".");
      let integer = (point === -1 ? value : value.slice(0, point)).replace(/^0+(?=\d)/, "");
      if (point !== -1 && integer === "") integer = "0";
      integer = integer.slice(0, decimals ? MAX_RIAL_DIGITS - 1 : MAX_RIAL_DIGITS);
      if (point === -1) return integer;
      return `${integer}.${value.slice(point + 1).replace(/\./g, "").slice(0, 1)}`;
    },
    format: (value, digits) => {
      const [integer = "", fraction] = value.split(".");
      const grouped = integer.replace(/\B(?=(\d{3})+$)/g, digits === "fa" ? "٬" : ",");
      return fraction === undefined ? grouped : `${grouped}${digits === "fa" ? "٫" : "."}${fraction}`;
    },
  };
}

const MASKS: Record<PriceUnit, InputMask> = { toman: amountMask("toman"), rial: amountMask("rial") };

/** Significant characters (in `unit`) for an amount in toman. */
function toSignificant(toman: number | null, unit: PriceUnit): string {
  if (toman === null) return "";
  return unit === "toman" ? String(toman) : String(Math.round(toman * 10));
}

/** Amount in toman for significant characters typed in `unit`. */
function toToman(significant: string, unit: PriceUnit): number | null {
  if (significant === "") return null;
  const amount = Number(significant.endsWith(".") ? significant.slice(0, -1) : significant);
  return unit === "toman" ? amount : amount / 10;
}

const sameAmount = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 1e-9);

/** The typed amount in words; a toman fraction is read as rials: «دوازده تومان و پنج ریال». */
function amountInWords(significant: string, unit: PriceUnit, labels: PriceInputLabels): string | null {
  if (significant === "") return null;
  const [integer = "0", fraction = ""] = significant.split(".");
  const whole = `${numberToWords(integer)} ${labels[unit]}`;
  const rial = Number(fraction || "0");
  if (unit === "rial" || rial === 0) return whole;
  const rialWords = `${numberToWords(rial)} ${labels.rial}`;
  return Number(integer) === 0 ? rialWords : `${whole} و ${rialWords}`;
}

/**
 * Amount input with live thousands separators and a toman/rial switch. The
 * value is always in toman; the switch only changes the unit the user types
 * in (typing ۱٬۵۰۰ in rial gives 150 toman). The caret stays next to the
 * digit being edited as separators come and go.
 */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(function PriceInput(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    unit: unitProp,
    defaultUnit = "toman",
    onUnitChange,
    showUnitToggle = true,
    showWords = false,
    labels: labelsProp,
    onChange,
    label,
    hint,
    error,
    digits = "fa" as Digits,
    dir,
    className,
    id,
    name,
    disabled,
    "aria-describedby": ariaDescribedBy,
    ...inputProps
  },
  ref,
) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const explicitDir = useExplicitDirection(dir);
  const generatedId = useId();
  const ids = {
    inputId: id ?? `${generatedId}-input`,
    hintId: `${generatedId}-hint`,
    errorId: `${generatedId}-error`,
  };
  const wordsId = `${generatedId}-words`;
  const [unit, setUnit] = useControllableState(unitProp, defaultUnit, onUnitChange);
  // What the user typed, in the unit they typed it in. Keeps states such as "12." intact.
  const [draft, setDraft] = useState(() => ({
    unit,
    text: toSignificant(valueProp !== undefined ? valueProp : defaultValue, unit),
  }));

  const draftToman = toToman(draft.text, draft.unit);
  const toman = valueProp !== undefined ? valueProp : draftToman;
  // Show the draft while it still describes the current amount in the current
  // unit; otherwise (unit switched, or value changed from outside) derive it.
  const significant =
    draft.unit === unit && sameAmount(draftToman, toman) ? draft.text : toSignificant(toman, unit);

  const { display, handleChange } = useMaskedInput({
    value: significant,
    mask: MASKS[unit],
    digits,
    onChange,
    onValueChange: (next) => {
      setDraft({ unit, text: next });
      const nextToman = toToman(next, unit);
      if (!sameAmount(nextToman, toman)) onValueChange?.(nextToman, details(nextToman, unit));
    },
  });

  const changeUnit = (next: PriceUnit) => {
    if (next !== unit) setUnit(next);
  };

  const words = showWords ? amountInWords(significant, unit, labels) : null;

  return (
    <Field
      ids={ids}
      label={label}
      hint={hint}
      error={error}
      dir={explicitDir}
      className={cx("pui-price-input", className)}
      name={name}
      submitValue={toman === null ? "" : String(toman)}
      disabled={disabled}
      end={
        showUnitToggle ? (
          <UnitSwitch unit={unit} labels={labels} disabled={disabled} onChange={changeUnit} />
        ) : (
          <span className="pui-field__affix">{labels[unit]}</span>
        )
      }
      after={
        words && (
          <div id={wordsId} className="pui-price-input__words">
            {words}
          </div>
        )
      }
    >
      <input
        {...inputProps}
        ref={ref}
        id={ids.inputId}
        type="text"
        dir="ltr"
        inputMode={unit === "toman" ? "decimal" : "numeric"}
        autoComplete={inputProps.autoComplete ?? "off"}
        className="pui-field__input"
        value={display}
        disabled={disabled}
        aria-invalid={hasError(error) || undefined}
        aria-describedby={
          [ariaDescribedBy, words ? wordsId : null, describedBy(ids, hint, error)].filter(Boolean).join(" ") ||
          undefined
        }
        onChange={handleChange}
      />
    </Field>
  );
});

function details(toman: number | null, unit: PriceUnit): PriceChangeDetails {
  return { rial: toman === null ? null : Math.round(toman * 10), unit };
}

interface UnitSwitchProps {
  unit: PriceUnit;
  labels: PriceInputLabels;
  disabled: boolean | undefined;
  onChange: (unit: PriceUnit) => void;
}

/** A radio group (WAI-ARIA pattern) with arrow keys that follow the reading direction. */
function UnitSwitch({ unit, labels, disabled, onChange }: UnitSwitchProps) {
  const buttons = useRef(new Map<PriceUnit, HTMLButtonElement>());

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const rtl = getDirection(event.currentTarget) === "rtl";
    const forwardKeys = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"];
    const backwardKeys = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"];
    const step = forwardKeys.includes(event.key) ? 1 : backwardKeys.includes(event.key) ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = UNITS[(UNITS.indexOf(unit) + step + UNITS.length) % UNITS.length]!;
    onChange(next);
    buttons.current.get(next)?.focus();
  };

  return (
    <div className="pui-price-input__units" role="radiogroup" aria-label={labels.unit}>
      {UNITS.map((option) => (
        <button
          key={option}
          ref={(node) => {
            if (node) buttons.current.set(option, node);
            else buttons.current.delete(option);
          }}
          type="button"
          role="radio"
          aria-checked={option === unit}
          tabIndex={option === unit ? 0 : -1}
          disabled={disabled}
          className="pui-price-input__unit"
          onClick={() => onChange(option)}
          onKeyDown={handleKeyDown}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
