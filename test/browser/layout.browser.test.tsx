import "../../src/styles/index.css";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PersianCalendar } from "../../src/react/calendar/PersianCalendar";
import { PersianDatePicker } from "../../src/react/date-picker/PersianDatePicker";
import { ShebaInput } from "../../src/react/inputs/ShebaInput";
import { PersianText } from "../../src/react/persian-text/PersianText";
import { PriceInput } from "../../src/react/price-input/PriceInput";
import { cleanup } from "@testing-library/react";

/*
 * These run in a real browser, so they check where things actually end up on
 * screen, which jsdom can't: column order, which side controls sit on, and
 * the visual order of numbers inside Persian text.
 */

afterEach(() => cleanup());

const SENTENCE = "با شماره +98 912 345 6789 تماس بگیرید";

/** Screen rectangle of the first occurrence of `text` inside `element`. */
function textRect(element: Element, text: string): DOMRect {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent!.indexOf(text);
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      return range.getBoundingClientRect();
    }
  }
  throw new Error(`"${text}" not found`);
}

const rect = (element: Element) => element.getBoundingClientRect();

describe("bidi isolation, measured", () => {
  it("shows the bug in a plain span: the phone number's groups come out reversed", () => {
    const { container } = render(
      <p dir="rtl" style={{ fontSize: "20px" }}>
        <span>{SENTENCE}</span>
      </p>,
    );
    const paragraph = container.firstElementChild!;
    expect(textRect(paragraph, "6789").left).toBeLessThan(textRect(paragraph, "+98").left);
  });

  it("keeps the phone number in order inside PersianText", () => {
    const { container } = render(
      <p dir="rtl" style={{ fontSize: "20px" }}>
        <PersianText>{SENTENCE}</PersianText>
      </p>,
    );
    const paragraph = container.firstElementChild!;
    const plus98 = textRect(paragraph, "+98");
    const group912 = textRect(paragraph, "912");
    const group6789 = textRect(paragraph, "6789");
    expect(plus98.left).toBeLessThan(group912.left);
    expect(group912.left).toBeLessThan(group6789.left);
  });

  it("keeps Persian text in order inside a left-to-right page", () => {
    const { container } = render(
      <p dir="ltr" style={{ fontSize: "20px" }}>
        Name: <PersianText>{"علی رضایی"}</PersianText>!
      </p>,
    );
    const paragraph = container.firstElementChild!;
    // Right to left inside the isolate: the first word sits to the right of the second.
    expect(textRect(paragraph, "علی").left).toBeGreaterThan(textRect(paragraph, "رضایی").left);
    expect(textRect(paragraph, "Name:").left).toBeLessThan(textRect(paragraph, "رضایی").left);
  });
});

describe.each(["rtl", "ltr"] as const)("layout in a %s page", (dir) => {
  const rtl = dir === "rtl";

  it("puts Saturday and the previous-month button on the starting side", () => {
    render(
      <div dir={dir}>
        <PersianCalendar defaultValue="2025-04-04" />
      </div>,
    );
    const headers = screen.getAllByRole("columnheader");
    const saturday = rect(headers[0]!);
    const friday = rect(headers[6]!);
    const previous = rect(screen.getByRole("button", { name: "ماه قبل" }));
    const next = rect(screen.getByRole("button", { name: "ماه بعد" }));
    if (rtl) {
      expect(saturday.left).toBeGreaterThan(friday.left);
      expect(previous.left).toBeGreaterThan(next.left);
    } else {
      expect(saturday.left).toBeLessThan(friday.left);
      expect(previous.left).toBeLessThan(next.left);
    }
  });

  it("opens the date picker aligned with the field's starting edge", async () => {
    render(
      <div dir={dir} style={{ padding: "0 200px" }}>
        <PersianDatePicker label="تاریخ" defaultOpen />
      </div>,
    );
    const control = rect(document.querySelector(".pui-field__control")!);
    const popup = rect(screen.getByRole("dialog"));
    if (rtl) expect(Math.abs(popup.right - control.right)).toBeLessThan(1);
    else expect(Math.abs(popup.left - control.left)).toBeLessThan(1);
    expect(popup.top).toBeGreaterThan(control.bottom);
  });

  it("opens the date picker upwards when there is no room below", () => {
    render(
      <div dir={dir} style={{ position: "fixed", insetBlockEnd: "8px", insetInlineStart: "8px" }}>
        <PersianDatePicker label="تاریخ" defaultOpen />
      </div>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-side", "top");
    expect(rect(dialog).bottom).toBeLessThan(rect(document.querySelector(".pui-field__control")!).top);
  });

  it("keeps IR on the left of the Sheba digits", () => {
    render(
      <div dir={dir}>
        <ShebaInput label="شبا" />
      </div>,
    );
    const affix = rect(document.querySelector(".pui-field__affix")!);
    const input = rect(screen.getByLabelText("شبا"));
    expect(affix.right).toBeLessThanOrEqual(input.left + 1);
  });

  it("puts the price unit switch at the end of the field", () => {
    render(
      <div dir={dir}>
        <PriceInput label="مبلغ" />
      </div>,
    );
    const units = rect(screen.getByRole("radiogroup"));
    const input = rect(screen.getByLabelText("مبلغ"));
    if (rtl) expect(units.right).toBeLessThanOrEqual(input.left + 1);
    else expect(units.left).toBeGreaterThanOrEqual(input.right - 1);
  });

  it("aligns number fields with the page's reading direction", () => {
    render(
      <div dir={dir}>
        <PriceInput label="مبلغ" digits="en" defaultValue={1000} />
      </div>,
    );
    const input = screen.getByLabelText("مبلغ") as HTMLInputElement;
    expect(input.dir).toBe("ltr");
    expect(getComputedStyle(input).textAlign).toBe(rtl ? "end" : "start");
  });
});
