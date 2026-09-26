import type { Digits } from "@amirjaz/persian-ui/core";
import type { ChangeEvent, ChangeEventHandler } from "react";
import { caretAfter, extractSignificant, toDisplay, type InputMask } from "./mask";

interface UseMaskedInputOptions {
  /** Current significant characters. */
  value: string;
  onValueChange: (value: string) => void;
  mask: InputMask;
  digits: Digits;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
}

/**
 * Keeps an input's display formatted as the user types, pastes or deletes,
 * and puts the caret back next to the same significant character.
 */
export function useMaskedInput({ value, onValueChange, mask, digits, onChange }: UseMaskedInputOptions) {
  const display = toDisplay(value, mask, digits);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const raw = input.value;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? "";
    let { value: next, beforeCaret } = extractSignificant(raw, input.selectionStart ?? raw.length, mask);

    // Deleting only a separator would be undone by reformatting, leaving the
    // caret stuck: delete the significant character next to it instead.
    if (next === value && raw.length < display.length) {
      if (inputType === "deleteContentBackward" && beforeCaret > 0) {
        next = next.slice(0, beforeCaret - 1) + next.slice(beforeCaret);
        beforeCaret -= 1;
      } else if (inputType === "deleteContentForward") {
        next = next.slice(0, beforeCaret) + next.slice(beforeCaret + 1);
      }
    }

    let sanitized = mask.sanitize(next);
    if (sanitized !== next) {
      if (!next.startsWith(sanitized)) {
        beforeCaret = sanitized.length; // a prefix was converted: put the caret at the end
      } else if (inputType === "insertText" && next.length > value.length) {
        // Typing into a full field: ignore the keystroke instead of pushing digits off the end.
        beforeCaret -= next.length - value.length;
        sanitized = value;
      } else {
        beforeCaret = Math.min(beforeCaret, sanitized.length);
      }
    }

    const nextDisplay = toDisplay(sanitized, mask, digits);
    const caret = caretAfter(nextDisplay, beforeCaret, mask);
    input.value = nextDisplay;
    input.setSelectionRange(caret, caret);

    onChange?.(event);
    if (sanitized !== value) onValueChange(sanitized);
  };

  return { display, handleChange };
}
