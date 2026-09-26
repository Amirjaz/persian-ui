/** Which digit glyphs to render: Persian (۰-۹) or Latin (0-9). */
export type Digits = "fa" | "en";

/**
 * Result of every validator: either the normalized value(s), or the reason the
 * input was rejected. Reasons are stable identifiers; see `validationMessages`
 * for their Persian texts.
 */
export type ValidationResult<TValid extends object, TReason extends string> =
  | ({ valid: true } & TValid)
  | { valid: false; reason: TReason };
