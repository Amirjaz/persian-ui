import "../src/styles/index.css";
import "./playground.css";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CardNumberInput,
  DirectionProvider,
  MobileInput,
  NationalIdInput,
  PersianCalendar,
  PersianDatePicker,
  PersianDateRangePicker,
  PersianRangeCalendar,
  PersianText,
  PriceInput,
  ShebaInput,
  type DateRange,
  type Direction,
} from "../src/react";
import { Shots } from "./shots";

/** Dev-only page: every component, right-to-left and left-to-right side by side. */
function Column({ dir }: { dir: Direction }) {
  const [price, setPrice] = useState<number | null>(1250000);
  const [date, setDate] = useState<string | null>("2025-04-04");
  const [range, setRange] = useState<DateRange>({ start: "2025-03-21", end: "2025-03-25" });
  return (
    <DirectionProvider dir={dir}>
      <section className="column" dir={dir}>
        <h2>{dir === "rtl" ? "راست به چپ" : "Left to right"}</h2>
        <p className="sentence">
          <PersianText>{"برای پشتیبانی با شماره +98 912 345 6789 تماس بگیرید."}</PersianText>
        </p>
        <p className="sentence">
          <span>{"بدون ایزوله‌سازی با شماره +98 912 345 6789 تماس بگیرید."}</span>
        </p>
        <NationalIdInput label="کد ملی" hint="ده رقم روی کارت ملی" required />
        <MobileInput label="تلفن همراه" />
        <ShebaInput label="شماره شبا" />
        <CardNumberInput label="شماره کارت" />
        <PriceInput label="مبلغ" value={price} onValueChange={setPrice} showWords />
        <output className="note">value: {String(price)} toman</output>
        <PersianDatePicker label="تاریخ تولد" value={date} onValueChange={setDate} showGregorian />
        <output className="note">value: {String(date)}</output>
        <PersianDateRangePicker label="تاریخ سفر" value={range} onValueChange={setRange} />
        <output className="note">
          value: {String(range.start)} → {String(range.end)}
        </output>
        <PersianRangeCalendar defaultValue={{ start: "2025-03-21", end: "2025-03-25" }} />
        <PersianCalendar defaultValue="2025-03-21" showGregorian />
      </section>
    </DirectionProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {new URLSearchParams(location.search).has("shots") ? (
      <Shots />
    ) : (
      <main className="playground">
        <Column dir="rtl" />
        <Column dir="ltr" />
      </main>
    )}
  </StrictMode>,
);
