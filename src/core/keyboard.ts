/** Target layout for {@link fixKeyboardLayout}: Persian or English (US QWERTY). */
export type KeyboardLayout = "fa" | "en";

/*
 * The two layouts key by key, row by row: the number row (`…=), the Q row
 * (q…]), the A row (a…') and the Z row (z…/). Each string has one character per
 * key, in the same order, for the normal and the Shift level. Persian follows
 * ISIRI 9147, the standard layout (Windows "Persian (Standard)", macOS, Android
 * and iOS); invisible characters and marks are written as escapes.
 */
const US_NORMAL = "`1234567890-=" + "qwertyuiop[]" + "asdfghjkl;'" + "zxcvbnm,./";
const US_SHIFT = "~!@#$%^&*()_+" + "QWERTYUIOP{}" + 'ASDFGHJKL:"' + "ZXCVBNM<>?";

const PERSIAN_NORMAL =
  // ZWJ, then the Persian digits ۱…۰
  "\u200d\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9\u06f0-=" +
  "ضصثقفغعهخحجچ" +
  "شس\u06ccبلاتنم\u06a9گ" + // ی and ک are the Persian forms
  "ظطزرذدپو./";

const PERSIAN_SHIFT =
  // ÷ ! ٬ ٫ ﷼ ٪ × ، * ) ( ـ +  (the parentheses swap, as in right-to-left text)
  "÷!\u066c\u066b\ufdfc\u066a×\u060c*)(\u0640+" +
  // sukun, dammatan, kasratan, fathatan, damma, kasra, fatha, shadda, ] [ } {
  "\u0652\u064c\u064d\u064b\u064f\u0650\u064e\u0651][}{" +
  // ؤ ئ ي (Arabic) إ أ آ ة » « : ؛
  "\u0624\u0626\u064a\u0625\u0623\u0622\u0629»«:\u061b" +
  // ك (Arabic), maddah above, ژ, superscript alef, ZWNJ, hamza above, ء > < ؟
  "\u0643\u0653\u0698\u0670\u200c\u0654\u0621><\u061f";

const TO_PERSIAN = new Map<string, string>();
const TO_ENGLISH = new Map<string, string>();
for (const [us, persian] of [
  [US_NORMAL, PERSIAN_NORMAL],
  [US_SHIFT, PERSIAN_SHIFT],
] as const) {
  for (let index = 0; index < us.length; index += 1) {
    TO_PERSIAN.set(us.charAt(index), persian.charAt(index));
    TO_ENGLISH.set(persian.charAt(index), us.charAt(index));
  }
}

/**
 * Retypes text that was typed with the wrong keyboard layout active, key by
 * key: what the same keys produce in the Persian layout (`"fa"`) or in the US
 * English layout (`"en"`). Uppercase Latin letters count as Shift, so «H»
 * becomes «آ». Characters that no key produces in the source layout, such as
 * spaces, pass through unchanged.
 *
 * @example
 * fixKeyboardLayout("sghl", "fa") // "سلام"
 * fixKeyboardLayout("اثممخ", "en") // "hello"
 *
 * For search, try the query as typed and, if it finds nothing, its retyped form.
 */
export function fixKeyboardLayout(text: string, to: KeyboardLayout): string {
  const map = to === "fa" ? TO_PERSIAN : TO_ENGLISH;
  let result = "";
  for (const char of text) result += map.get(char) ?? char;
  return result;
}
