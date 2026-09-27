import "./shots.css";
import { normalizePersian } from "@amirjaz/persian-ui/core";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
import { nationalIdFromBody, shebaFromBban } from "../test/generators";

/*
 * Scenes captured for the README by scripts/screenshots.mjs (open /?shots).
 * Identifiers are generated from their checksums, never real ones.
 */
const NATIONAL_ID = nationalIdFromBody("001234567");
const SHEBA = shebaFromBban("0170000000123456789012");
const ZWNJ = "\u200c";

export function Shots() {
  return (
    <div className="shots">
      <HeroShot />
      <BidiShot />
      <SearchShot />
      <ThemesShot />
    </div>
  );
}

/* What users see, and what the form actually submits (read from the live form). */
function HeroShot() {
  const form = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState<[string, string][]>([]);

  useEffect(() => {
    const update = () => setSubmitted([...new FormData(form.current!)] as [string, string][]);
    update();
    const timer = setTimeout(update, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="shot-hero" className="canvas hero" dir="ltr">
      <div className="scene-col">
        <Eyebrow dot="blue">What your users see</Eyebrow>
        <DirectionProvider dir="rtl">
          <form ref={form} className="card form-card" dir="rtl" onSubmit={(event) => event.preventDefault()}>
            <div className="form-card__header">
              <h3>درخواست وام</h3>
              <p>{`ارقام را فارسی یا انگلیسی وارد کنید؛ فرقی نمی${ZWNJ}کند.`}</p>
            </div>
            <div className="form-card__grid">
              <NationalIdInput name="nationalId" label="کد ملی" defaultValue={NATIONAL_ID} />
              <MobileInput name="mobile" label="تلفن همراه" defaultValue="09123456789" />
              <ShebaInput className="span-2" name="sheba" label="شماره شبا" defaultValue={SHEBA} />
              <PriceInput name="amount" label="مبلغ وام" defaultValue={150000000} />
              <PersianDatePicker name="birthDate" label="تاریخ تولد" defaultValue="1998-08-23" />
            </div>
            <button type="submit" className="form-card__submit">
              ثبت درخواست
            </button>
          </form>
        </DirectionProvider>
      </div>

      <div className="hero-arrow" aria-hidden="true">
        <span>submit</span>
        <svg viewBox="0 0 48 16" width="48" height="16">
          <path
            d="M0 8h44M38 2l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="scene-col">
        <Eyebrow dot="violet">What your server gets</Eyebrow>
        <div className="card code-card">
          <div className="code-card__bar">
            <span />
            <span />
            <span />
            <em>POST /api/loans</em>
          </div>
          <pre>
            <span className="tok-punct">{"{"}</span>
            {"\n"}
            {submitted.map(([key, value], index) => (
              <span key={key}>
                {"  "}
                <span className="tok-key">{key}</span>
                <span className="tok-punct">: </span>
                <span className="tok-string">{`"${value}"`}</span>
                {index < submitted.length - 1 ? <span className="tok-punct">,</span> : null}
                {"\n"}
              </span>
            ))}
            <span className="tok-punct">{"}"}</span>
          </pre>
          <ul className="code-card__notes">
            <li>Latin digits, no dashes or spaces</li>
            <li>Amount in toman, time-zone-free date</li>
            <li>Same validators run on your server</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const TRACKING = ["کد پیگیری سفارش: ", "1404-0715-3321", ""];
const RANGE = ["تخفیف ", "۱۰-۲۰", ` درصدی روی همهٔ کفش${ZWNJ}ها`];
const PHONE = ["پشتیبانی: ", "+98 912 345 6789", ""];
const MESSAGES = [TRACKING, RANGE, PHONE];

/* The same three messages, as plain text and through PersianText. */
function BidiShot() {
  return (
    <section id="shot-bidi" className="canvas pair" dir="ltr">
      <div className="scene-col">
        <Eyebrow dot="red">Plain text</Eyebrow>
        <div className="card chat" dir="rtl">
          <ChatHeader />
          {MESSAGES.map(([before, number, after]) => (
            <p key={number} className="bubble">
              {before}
              <span className="broken">{number}</span>
              {after}
            </p>
          ))}
        </div>
        <p className="caption caption-bad">Tracking code, range and phone number come out reversed.</p>
      </div>
      <div className="scene-col">
        <Eyebrow dot="green">
          <code>{"<PersianText>"}</code>
        </Eyebrow>
        <div className="card chat chat-fixed" dir="rtl">
          <ChatHeader />
          {MESSAGES.map((parts) => (
            <PersianText key={parts[1]} as="p" className="bubble">
              {parts.join("")}
            </PersianText>
          ))}
        </div>
        <p className="caption caption-good">Every number keeps its order, checked in a real browser.</p>
      </div>
    </section>
  );
}

function ChatHeader() {
  return (
    <div className="chat__header">
      <span className="chat__avatar">ف</span>
      <div>
        <strong>فروشگاه آنلاین</strong>
        <small>پیامک</small>
      </div>
    </div>
  );
}

const ARABIC_YEH = "\u064a";
const ALEF_MAKSURA = "\u0649";
const FATHA = "\u064e";
const QUERY = "علی";
const CONTACTS: { name: string; why?: string }[] = [
  { name: "علی محمدی" },
  { name: `عل${ARABIC_YEH} رضا${ARABIC_YEH}ی`, why: `Arabic ${ARABIC_YEH}` },
  { name: `ع${FATHA}لی کریمی`, why: "diacritic" },
  { name: `عل${ALEF_MAKSURA} صادقی`, why: `Arabic ${ALEF_MAKSURA}` },
  { name: "مهدی علیزاده" },
];
const searchKey = (text: string) => normalizePersian(text, { mode: "search" });

/* Contacts typed on different keyboards, searched with and without normalizePersian. */
function SearchShot() {
  return (
    <section id="shot-search" className="canvas pair" dir="ltr">
      <SearchPanel
        dot="red"
        code="name.includes(query)"
        caption="Names typed on an Arabic keyboard or with a diacritic are missed."
        matches={(name) => name.includes(QUERY)}
      />
      <SearchPanel
        dot="green"
        code={'normalizePersian(name, { mode: "search" })'}
        caption="Letter variants, diacritics, ZWNJ and digit scripts all folded."
        matches={(name) => searchKey(name).includes(searchKey(QUERY))}
      />
    </section>
  );
}

interface SearchPanelProps {
  dot: "red" | "green";
  code: string;
  caption: string;
  matches: (name: string) => boolean;
}

function SearchPanel({ dot, code, caption, matches }: SearchPanelProps) {
  const found = CONTACTS.filter((contact) => matches(contact.name)).length;
  return (
    <div className="scene-col">
      <Eyebrow dot={dot}>
        <code>{code}</code>
      </Eyebrow>
      <div className="card search" dir="rtl">
        <div className="search__box">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{QUERY}</span>
          <span className="search__caret" />
          <span className={`search__count search__count-${dot}`} dir="ltr">
            {found} of {CONTACTS.length} found
          </span>
        </div>
        <ul className="search__list">
          {CONTACTS.map((contact) => {
            const hit = matches(contact.name);
            return (
              <li key={contact.name} data-hit={hit || undefined}>
                <span className="search__initial">{searchKey(contact.name)[0]}</span>
                <span className="search__name">{contact.name}</span>
                {contact.why ? (
                  <span className="search__why" dir="ltr">
                    {contact.why}
                  </span>
                ) : null}
                <span className="search__mark">{hit ? "✓" : "✗"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className={`caption caption-${dot === "red" ? "bad" : "good"}`}>{caption}</p>
    </div>
  );
}

const DARK = {
  "--pui-color-text": "#fafafa",
  "--pui-color-muted": "#a1a1aa",
  "--pui-color-background": "#09090b",
  "--pui-color-surface": "#18181b",
  "--pui-color-border": "#3f3f46",
  "--pui-color-hover": "#27272a",
  "--pui-color-accent": "#8b5cf6",
  "--pui-color-holiday": "#fb7185",
  "--pui-color-focus-ring": "#a78bfa",
} as CSSProperties;

const BRAND = {
  "--pui-color-accent": "#0d9488",
  "--pui-color-holiday": "#e11d48",
  "--pui-color-border": "#99f6e4",
  "--pui-color-hover": "#f0fdfa",
  "--pui-radius": "999px",
} as CSSProperties;

/* The date picker as shipped, then the calendar in dark mode and in a custom theme, left-to-right. */
function ThemesShot() {
  return (
    <section id="shot-themes" className="canvas trio" dir="ltr">
      <div className="scene-col">
        <Eyebrow dot="blue">Default · right-to-left</Eyebrow>
        <DirectionProvider dir="rtl">
          <div className="card theme-card theme-card-picker" dir="rtl">
            <PersianDatePicker label="تاریخ سفر" defaultValue="2025-03-21" defaultOpen />
          </div>
        </DirectionProvider>
      </div>
      <div className="scene-col">
        <Eyebrow dot="violet">Dark mode · Gregorian days</Eyebrow>
        <DirectionProvider dir="rtl">
          <div className="card theme-card theme-card-dark" dir="rtl" style={DARK}>
            <PersianCalendar defaultValue="2025-03-21" showGregorian />
          </div>
        </DirectionProvider>
      </div>
      <div className="scene-col">
        <Eyebrow dot="teal">Your brand · left-to-right</Eyebrow>
        <DirectionProvider dir="ltr">
          <div className="card theme-card" dir="ltr" style={BRAND}>
            <PersianCalendar defaultValue="2025-03-21" />
          </div>
        </DirectionProvider>
      </div>
    </section>
  );
}

function Eyebrow({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span className={`eyebrow__dot eyebrow__dot-${dot}`} />
      {children}
    </div>
  );
}
