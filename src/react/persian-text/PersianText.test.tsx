import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { ARABIC_YEH, PERSIAN_YEH, fa } from "../../../test/chars";
import { DIRECTION_SETUPS, expectNoA11yViolations, renderWithDirection } from "../../../test/react";
import { PersianText } from "./PersianText";

const SENTENCE = "با شماره +98 912 345 6789 تماس بگیرید";
const bdiTexts = (container: Element) => Array.from(container.querySelectorAll("bdi"), (bdi) => bdi.textContent);

describe("PersianText", () => {
  it("renders an isolated right-to-left span", () => {
    const { container } = render(<PersianText>سلام</PersianText>);
    const span = container.firstElementChild!;
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveAttribute("dir", "rtl");
    expect(span).toHaveClass("pui-text");
  });

  it("wraps left-to-right runs in <bdi dir=ltr> so they keep their order", () => {
    const { container } = render(<PersianText>{SENTENCE}</PersianText>);
    expect(bdiTexts(container)).toEqual(["+98 912 345 6789"]);
    expect(container.querySelector("bdi")).toHaveAttribute("dir", "ltr");
    expect(container.textContent).toBe(SENTENCE);
  });

  it("normalizes the text unless told not to", () => {
    const arabic = `عل${ARABIC_YEH}`;
    expect(render(<PersianText>{arabic}</PersianText>).container.textContent).toBe(`عل${PERSIAN_YEH}`);
    expect(render(<PersianText normalize={false}>{arabic}</PersianText>).container.textContent).toBe(arabic);
  });

  it("converts digits to Persian except inside Latin text", () => {
    const { container } = render(<PersianText digits="fa">{"iPhone 15 با قیمت 45000000 تومان"}</PersianText>);
    expect(bdiTexts(container)).toEqual(["iPhone 15", fa("45000000")]);
  });

  it("converts digits to Latin on request, and leaves them by default", () => {
    expect(render(<PersianText digits="en">{`سال ${fa("1404")}`}</PersianText>).container.textContent).toBe("سال 1404");
    expect(render(<PersianText>{`سال ${fa("1404")}`}</PersianText>).container.textContent).toBe(`سال ${fa("1404")}`);
  });

  it("renders the requested element, forwards the ref and extra props", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <PersianText as="p" ref={ref} className="note" dir="auto" title="t">
        سلام
      </PersianText>,
    );
    const p = container.firstElementChild!;
    expect(p.tagName).toBe("P");
    expect(ref.current).toBe(p);
    expect(p).toHaveClass("pui-text", "note");
    expect(p).toHaveAttribute("dir", "auto");
    expect(p).toHaveAttribute("title", "t");
  });

  describe.each(DIRECTION_SETUPS)("in a $name", (setup) => {
    it("isolates itself and its left-to-right runs the same way", async () => {
      const { container } = renderWithDirection(<PersianText>{SENTENCE}</PersianText>, setup);
      const span = container.querySelector(".pui-text")!;
      expect(span).toHaveAttribute("dir", "rtl");
      expect(bdiTexts(container)).toEqual(["+98 912 345 6789"]);
      await expectNoA11yViolations(container);
    });
  });
});
