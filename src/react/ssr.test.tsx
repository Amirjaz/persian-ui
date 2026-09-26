// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DirectionProvider,
  MobileInput,
  NationalIdInput,
  PersianCalendar,
  PersianDatePicker,
  PersianText,
  PriceInput,
  ShebaInput,
} from "./index";

/*
 * Server rendering (Next.js, Remix, …) runs without `window` or `document`.
 * Every component must render to HTML there without touching the browser.
 */
describe("server rendering", () => {
  it("has no DOM to lean on", () => {
    expect(typeof window).toBe("undefined");
  });

  it("renders every component to HTML", () => {
    const html = renderToString(
      <DirectionProvider dir="rtl">
        <PersianText>{"شماره +98 912 345 6789"}</PersianText>
        <NationalIdInput label="کد ملی" name="nationalId" />
        <MobileInput label="موبایل" />
        <ShebaInput label="شبا" />
        <PriceInput label="مبلغ" defaultValue={1500} />
        <PersianCalendar defaultValue="2025-04-04" />
        <PersianDatePicker label="تاریخ" defaultValue="2025-04-04" defaultOpen />
      </DirectionProvider>,
    );
    expect(html).toContain('<bdi dir="ltr">+98 912 345 6789</bdi>');
    expect(html).toContain('role="grid"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('name="nationalId"');
  });
});
