import { describe, expect, it } from "vitest";
import { ARABIC_DECIMAL_SEPARATOR, ARABIC_THOUSANDS_SEPARATOR, NBSP, fa } from "../../../test/chars";
import { splitLtrRuns } from "./segments";

const ltrRuns = (text: string) => splitLtrRuns(text).filter((segment) => segment.ltr).map((segment) => segment.text);

describe("splitLtrRuns", () => {
  it("keeps a phone number in one run", () => {
    expect(splitLtrRuns("با شماره +98 912 345 6789 تماس بگیرید")).toEqual([
      { text: "با شماره ", ltr: false },
      { text: "+98 912 345 6789", ltr: true },
      { text: " تماس بگیرید", ltr: false },
    ]);
  });

  it("keeps ranges, dates and grouped numbers whole", () => {
    expect(ltrRuns(`${fa("10-20")} درصد`)).toEqual([fa("10-20")]);
    expect(ltrRuns(`تاریخ ${fa("1404/01/15")} است`)).toEqual([fa("1404/01/15")]);
    const amount = fa(`1${ARABIC_THOUSANDS_SEPARATOR}250${ARABIC_THOUSANDS_SEPARATOR}000`);
    expect(ltrRuns(`${amount} تومان`)).toEqual([amount]);
    expect(ltrRuns(`نرخ ${fa(`2${ARABIC_DECIMAL_SEPARATOR}5`)} درصد`)).toEqual([fa(`2${ARABIC_DECIMAL_SEPARATOR}5`)]);
  });

  it("keeps Latin phrases, versions, e-mails and URLs whole, without trailing punctuation", () => {
    expect(ltrRuns("نسخهٔ React 19.2 منتشر شد.")).toEqual(["React 19.2"]);
    expect(ltrRuns("ایمیل: info@example.com.")).toEqual(["info@example.com"]);
    expect(ltrRuns("سایت https://example.com/docs را ببینید")).toEqual(["https://example.com/docs"]);
    expect(ltrRuns(`قیمت iPhone${NBSP}15 Pro`)).toEqual([`iPhone${NBSP}15 Pro`]);
  });

  it("keeps trailing symbols such as C#, C++ and 50%", () => {
    expect(ltrRuns("زبان‌های C# و C++ با 50% تخفیف")).toEqual(["C#", "C++", "50%"]);
  });

  it("returns right-to-left text as one segment", () => {
    expect(splitLtrRuns("سلام دنیا")).toEqual([{ text: "سلام دنیا", ltr: false }]);
    expect(splitLtrRuns("")).toEqual([]);
    expect(splitLtrRuns("Hello")).toEqual([{ text: "Hello", ltr: true }]);
  });
});
