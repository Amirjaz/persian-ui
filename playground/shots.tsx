import {
  DirectionProvider,
  MobileInput,
  NationalIdInput,
  PersianCalendar,
  PersianDatePicker,
  PersianText,
  PriceInput,
  ShebaInput,
} from "../src/react";

const PHONE_SENTENCE = "برای پشتیبانی با شماره +98 912 345 6789 تماس بگیرید.";
const RANGE_SENTENCE = "تخفیف بین ۱۰-۲۰ درصد روی مدل‌های iPhone 15";

/** Compact blocks captured for the README by scripts/screenshots.mjs (open /?shots). */
export function Shots() {
  return (
    <div className="shots">
      <section id="shot-bidi" className="shot" dir="rtl">
        <div className="shot-row">
          <span className="shot-tag shot-tag-bad">✗ بدون ایزوله‌سازی</span>
          <p className="shot-text">{PHONE_SENTENCE}</p>
          <p className="shot-text">{RANGE_SENTENCE}</p>
        </div>
        <div className="shot-row">
          <span className="shot-tag shot-tag-good">✓ PersianText</span>
          <p className="shot-text">
            <PersianText>{PHONE_SENTENCE}</PersianText>
          </p>
          <p className="shot-text">
            <PersianText>{RANGE_SENTENCE}</PersianText>
          </p>
        </div>
      </section>

      <section id="shot-inputs" className="shot shot-narrow" dir="rtl">
        <NationalIdInput label="کد ملی" defaultValue="0012345678" />
        <MobileInput label="تلفن همراه" defaultValue="09123456789" />
        <ShebaInput label="شماره شبا" hint="۲۴ رقم بعد از IR" />
        <PriceInput label="مبلغ" defaultValue={1250000} />
      </section>

      <section id="shot-picker" className="shot shot-picker" dir="rtl">
        <PersianDatePicker label="تاریخ تولد" defaultValue="2025-04-04" defaultOpen showGregorian />
      </section>

      <div id="shot-directions" className="shot-pair">
        <DirectionProvider dir="rtl">
          <section className="shot" dir="rtl">
            <PersianCalendar defaultValue="2025-03-21" />
          </section>
        </DirectionProvider>
        <DirectionProvider dir="ltr">
          <section className="shot" dir="ltr">
            <PersianCalendar defaultValue="2025-03-21" />
          </section>
        </DirectionProvider>
      </div>
    </div>
  );
}
