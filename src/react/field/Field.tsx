import type { ReactNode, Ref } from "react";
import type { Direction } from "../direction";
import { cx } from "../utils";

export interface FieldIds {
  inputId: string;
  hintId: string;
  errorId: string;
  /** Set when inputs are labelled with `aria-labelledby` (the range picker's two inputs). */
  labelId?: string;
}

interface FieldProps {
  ids: FieldIds;
  label?: ReactNode;
  hint?: ReactNode;
  /** The error to show; `null`/`undefined`/`false` for none. */
  error?: ReactNode;
  dir?: Direction | undefined;
  className?: string | undefined;
  /** Direction of the control row, for inputs whose affixes read left to right. */
  controlDir?: Direction;
  start?: ReactNode;
  end?: ReactNode;
  /** Shown between the control row and the hint, e.g. an amount in words. */
  after?: ReactNode;
  /** `data-*` attributes for the root, e.g. `data-bank`. */
  data?: Record<`data-${string}`, string | undefined>;
  /** Hidden input carrying the normalized value for native form submission. */
  name?: string | undefined;
  submitValue: string;
  disabled?: boolean | undefined;
  rootRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

export function hasError(error: ReactNode): boolean {
  return error !== null && error !== undefined && error !== false && error !== "";
}

/** `aria-describedby` for the input: the hint, and the error while there is one. */
export function describedBy(ids: FieldIds, hint: ReactNode, error: ReactNode): string | undefined {
  const parts = [hint != null ? ids.hintId : null, hasError(error) ? ids.errorId : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/** Label, control row, hint and error, laid out with logical properties. */
export function Field({
  ids,
  label,
  hint,
  error,
  dir,
  className,
  controlDir,
  start,
  end,
  after,
  data,
  name,
  submitValue,
  disabled,
  rootRef,
  children,
}: FieldProps) {
  const invalid = hasError(error);
  return (
    <div
      {...data}
      ref={rootRef}
      className={cx("pui-field", className)}
      dir={dir}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label != null && (
        <label id={ids.labelId} className="pui-field__label" htmlFor={ids.inputId}>
          {label}
        </label>
      )}
      <div className="pui-field__control" dir={controlDir}>
        {start}
        {children}
        {end}
      </div>
      {after}
      {hint != null && (
        <div id={ids.hintId} className="pui-field__hint">
          {hint}
        </div>
      )}
      {/* Always rendered so screen readers announce errors as they appear. */}
      <div id={ids.errorId} className="pui-field__error" aria-live="polite">
        {invalid ? error : null}
      </div>
      {name !== undefined && <input type="hidden" name={name} value={submitValue} />}
    </div>
  );
}
