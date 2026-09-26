import { normalizePersian, toEnglishDigits, toPersianDigits } from "@amirjaz/persian-ui/core";
import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cx } from "../utils";
import { splitLtrRuns } from "./segments";

export interface PersianTextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dir"> {
  /** The text to display. */
  children: string;
  /** Element to render. Default `"span"`. */
  as?: ElementType;
  /** Apply `normalizePersian` (standard mode). Default `true`. */
  normalize?: boolean;
  /**
   * Digit glyphs: `"fa"` converts digits to Persian (except inside Latin text
   * such as «iPhone 15»), `"en"` converts to Latin, `"keep"` (default) leaves them.
   */
  digits?: "fa" | "en" | "keep";
  /** Base direction of the text. Default `"rtl"`. */
  dir?: "rtl" | "ltr" | "auto";
}

/**
 * Displays Persian text safely inside any layout. Latin words, numbers, phone
 * numbers and ranges are isolated in `<bdi dir="ltr">` so the bidi algorithm
 * can't reorder them («+98 912 345 6789» would otherwise render as
 * «6789 345 912 98+» inside a Persian sentence), and the element itself is
 * isolated from its surroundings.
 */
export const PersianText = forwardRef<HTMLElement, PersianTextProps>(function PersianText(
  { children, as: Tag = "span", normalize = true, digits = "keep", dir = "rtl", className, ...rest },
  ref,
) {
  const text = normalize ? normalizePersian(children) : children;
  return (
    <Tag ref={ref} dir={dir} className={cx("pui-text", className)} {...rest}>
      {splitLtrRuns(text).map((segment, index) =>
        segment.ltr ? (
          <bdi key={index} dir="ltr">
            {convertDigits(segment.text, digits, true)}
          </bdi>
        ) : (
          convertDigits(segment.text, digits, false)
        ),
      )}
    </Tag>
  );
});

function convertDigits(text: string, digits: "fa" | "en" | "keep", ltr: boolean): string {
  if (digits === "en") return toEnglishDigits(text);
  // Digits that belong to Latin text («iPhone 15», «Node 24») stay as written.
  if (digits === "fa" && !(ltr && /\p{Script=Latin}/u.test(text))) return toPersianDigits(text);
  return text;
}
