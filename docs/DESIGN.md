# @amirjaz/persian-ui — design record (v1)

Approved 2026-09-26. This is the source of truth for v1 scope and API decisions.
Changing anything here needs the maintainer's approval.

## Goals

A Persian-first React library that gets the things every Iranian team reimplements
right: RTL layout, bidi isolation, Jalali dates, Persian/Arabic-Indic digits, and
validators for Iranian identifiers.

## Settled tech

- React 18+ as an **optional** peer dependency (so `/core` users on a Node backend
  don't get React installed); react-dom likewise.
- TypeScript strict, pinned to **6.0.x**: TypeScript 7's npm package no longer ships
  the JS compiler API that tsup's `.d.ts` build needs (and tsup is unmaintained
  since Aug 2025, so that won't be fixed upstream).
- tsup, ESM + CJS, `.d.ts` + `.d.cts` per condition.
- `"sideEffects": ["*.css"]` (not `false`: `false` makes webpack drop the stylesheet
  import in production builds).
- CSS with custom properties, no Tailwind, no CSS-in-JS. Zero runtime dependencies.
- Vitest + Testing Library (jsdom), plus a small real-browser suite (Vitest browser
  mode driving the installed Edge through Playwright) for layout/bidi geometry.
- pnpm.
- License: MIT (same as Shamsi-Calendar and the ported jalaali-js code).

## Entries

| Specifier | Contents | Notes |
|---|---|---|
| `@amirjaz/persian-ui/core` | utilities, validators, Jalali helpers | no React, no `"use client"` — callable from Server Components |
| `@amirjaz/persian-ui` | components, `DirectionProvider` | `"use client"` banner; imports core through the public `/core` specifier (kept external → one copy); **never re-exports core runtime values** (they would become client references in RSC) |
| `@amirjaz/persian-ui/styles.css` | all component styles in `@layer persian-ui` | |
| `@amirjaz/persian-ui/styles.unlayered.css` | same, without `@layer` | for browsers older than Chrome 99 / Safari 15.4 / Firefox 97 |

A `core/package.json` stub points old resolvers (TypeScript `moduleResolution: node`,
older bundlers) at `dist/core`; publint and attw check every resolution mode.
First release: 0.1.0.

## Core API

- `toPersianDigits`, `toEnglishDigits` — Latin, Persian (۰-۹) and Arabic-Indic (٠-٩) digits.
- `normalizePersian(text, { mode })`
  - `standard` (default, safe for display and storage; used by `PersianText`):
    NFC, Arabic presentation forms → base letters, ي/ى → ی, ك → ک, ٠-٩ → ۰-۹,
    one encoding for ۀ (U+06C0), ZWNJ kept only where it prevents a join,
    horizontal whitespace collapsed (line breaks kept).
  - `search`: compatibility decomposition, all combining marks and tatweel stripped,
    ۀ/ة/ە → ه, أ/إ/آ/ٱ → ا, ؤ → و, ئ → ی, digits → Latin, format characters
    (ZWNJ, ZWJ, bidi controls) **removed** (so می‌روم matches میروم), Latin lowercased,
    all whitespace collapsed.
- `formatToman`, `formatRial` — `number | bigint | string`; options `suffix` (default
  true), `digits` ('fa' default | 'en'), `separator`. fa output follows CLDR:
  `٬` grouping, `٫` decimal, negatives as LRM + `−`. Decimals are supported (needed for
  toman values derived from rial, and later for the new rial's qeran).
- Jalali: `toJalali`, `toGregorian` (ISO `YYYY-MM-DD`), `formatJalali`, `parseJalali`,
  `isValidJalaliDate`, `isLeapJalaliYear`, `jalaliMonthLength`, plus month/weekday name
  constants. Algorithm: Borkowski, ported from jalaali-js (MIT), exact for Jalali
  years −61…3177; tests cross-check against jalaali-js and against ICU (`Intl`).
- Validators return `{ valid: true, …normalized } | { valid: false, reason }`:
  - `validateNationalId(code, { padShort })` — exactly 10 digits by default; `padShort`
    left-pads 8–9 digit input. Rejects repeated digits and all-zero digits 4–9, then the
    mod-11 checksum.
  - `validateIranianMobile(number)` — `09…`, `+989…`, `00989…`, `989…`, `9…` (10 digits);
    any `09` + 9 digits is valid; `operator` is the prefix's *original* operator
    (MCI/Irancell/Rightel, else `null`) — number portability exists since Aug 2016.
  - `validateSheba(iban)` — `IR` + 24 digits (IR optional), ISO 13616 mod-97, check
    digits 00/01/99 rejected.
  - `validatePostalCode(code, { strict })` — 10 digits, not all the same digit;
    `strict` adds "no 0 or 2 in the first five digits" (unofficial but consistent with
    every real example found; Iran Post's UPU filing only specifies 10 digits).
  - `validatePlate(plate, { strict })` — 2 digits, letter, 3 digits, region code 10–99;
    all issued Persian letters (ب ج د س ص ط ق ل م ن و ه ی + الف پ ت ث ز ژ ش ع ف ک گ, exported
    as `PLATE_LETTERS`); `strict` rejects 0 in the 2- and 3-digit groups.
  - `validationMessages` — Persian messages keyed by validator and reason.

## Components

- `DirectionProvider` / `useDirection`. Direction resolution: `dir` prop → provider →
  inherited DOM direction. Keyboard behaviour reads the DOM direction at event time.
  When direction is explicit, the component writes `dir` on its root.
- `PersianText` — `standard` normalization + `<bdi dir="ltr">` around LTR runs
  (phone numbers, ranges, Latin) + outer isolation.
- `NationalIdInput`, `MobileInput`, `ShebaInput`, `PriceInput` — masked; shared props:
  `value`/`defaultValue` (normalized), `onValueChange(value, result)`, `label`, `hint`,
  `error`, `messages`, `digits`, `name` (hidden input with the normalized value).
  Errors show on blur or when complete. `PriceInput` value is in **toman** (rial input
  that isn't a multiple of 10 keeps its fraction); the toggle switches the unit the
  user types in.
- `PersianDatePicker` + `PersianCalendar` (inline grid), absorbed from Shamsi-Calendar:
  value is an ISO `YYYY-MM-DD` string; typed entry + calendar button (WAI-ARIA date
  picker dialog); no Radix (native selects, inline dialog, own focus trap); kept
  extras: holidays, `weekStartsOn`, `classNames`, `asChild`, `isDateDisabled`,
  month/year jump, Today/Clear footer. Day arithmetic never uses `Date` + 24h
  (DST bug in Shamsi-Calendar).
  - `showHolidays` defaults to `true` (as in Shamsi-Calendar); lunar holidays use the tabular
    Hijri calendar (identical to ICU's islamic-civil), so they can be a day off the announced date.
  - Typed entry accepts «۱۴۰۴/۰۱/۱۵», `1404-1-15` and, for number-only keyboards, `14040115`.
  - The dialog renders inline (no portal), so it inherits `dir` and CSS variables; it opens
    upwards when there is no room below.
- Masked inputs keep the caret next to the same digit through formatting; deleting a lone
  separator deletes the neighbouring digit instead (decided from `inputType`, so it also works
  on Android keyboards whose key events report "Unidentified").

## CSS

- Flat single-class selectors, state in `data-*` attributes.
- Global tokens on `:root`; component tokens only read with fallbacks, never declared.
- Logical properties only — enforced by a test that scans all CSS and inline styles.

## Testing rules

- Every component under `dir="rtl"` and `dir="ltr"`, both via a DOM ancestor and via
  `DirectionProvider` alone.
- Persian, Arabic-Indic and Latin digit input on every numeric field.
- National IDs and Sheba numbers are generated from their checksums — never real ones,
  including in docs.
- Coverage: 100% for `src/core/**`, ≥ 90% for components.

---

# v0.2 additions

Approved by the maintainer 2026-09-28 (choices marked ✔ were picked from options).
Everything is additive; v0.1 APIs keep working. Release: 0.2.0.

## Core API

- **Bank cards and bank detection**
  - `validateCardNumber(card)` — 16 digits (Shetab), any digit script, spaces/dashes
    allowed. Reasons: `empty` `invalidCharacters` `length` `repeatedDigits` `checksum`
    (Luhn). Valid result: `value` (16 Latin digits) and `bank`.
  - `bank: IranianBank | null` — `{ id, name }` (`id` an English slug such as
    `"melli"`, `name` Persian, e.g. «بانک ملی ایران»). `null` for prefixes not in the
    table, so new banks and foreign cards still validate.
  - ✔ Merged institutions report the **current** bank plus `formerly` (the Persian name
    printed on the card): Ansar, Ghavamin, Hekmat Iranian, Kosar, Mehr Eqtesad → Sepah
    (2020); Noor → Melli (Azar 1402); Ayandeh → Melli (Aban 1404).
  - `validateSheba` gains the same `bank` field, from the 3-digit bank code after the
    check digits (e.g. `017` → Melli).
  - `getBankFromCardNumber(card)`, `getBankFromSheba(sheba)` — detection alone, from a
    partial number too (first 6 digits / first 5 digits after IR); `null` if unknown.
  - `IRANIAN_BANKS` — the table: `{ id, name, cardPrefixes, shebaCodes, mergedInto? }`.
  - Data rule: a card prefix is listed only when at least two independent sources agree
    (pishkhanak.com directory, persian-tools, public gists; checked Sep 2026), like the
    mobile-operator table. Sheba codes: pishkhanak and persian-tools agree exactly.
- **Amounts in words**
  - `numberToWords(value)` — `number | bigint | string` (any digit script, grouping
    separators allowed). «یک میلیون و دویست و پنجاه هزار», «صفر», «منفی …». 1000 is
    «یک هزار» (the cheque convention). Scale words up to کوادریلیون.
  - ✔ Integers only, `|value| < 10¹⁸`; fractions, unsafe `number`s (beyond
    `Number.MAX_SAFE_INTEGER`, pass a bigint or string) and malformed input throw
    `RangeError`.
- **Wrong-keyboard fix**
  - ✔ `fixKeyboardLayout(text, to)` with `to: "fa" | "en"` (no guessing):
    `fixKeyboardLayout("sghl", "fa")` → «سلام». Maps key by key and level by level
    (Shift) between US QWERTY and the standard Persian layout, ISIRI 9147 (Windows
    "Persian (Standard)", macOS, Android and iOS). Characters with no key (spaces,
    other scripts) pass through unchanged.

## Components

- **`CardNumberInput`** — a masked input like the others: shows ۶۰۳۷ ۹۹۱۲ ۳۴۵۶ ۷۸۹۰ in
  groups of four, value = 16 Latin digits, `onValueChange(value, result)` with
  `result.bank`. `showBank` (default `true`) shows the bank's name at the end of the
  field as soon as the prefix is known, and the root gets `data-bank="<id>"` so apps can
  add logos with CSS (the library ships no bank logos).
- **`ShebaInput`** gets the same `showBank` (default `true`) and `data-bank`.
- **`PriceInput`** gets `showWords` (default `false`): the amount in words under the
  field, in the unit being typed («یک میلیون و پانصد هزار تومان»; a fractional toman
  reads «دوازده تومان و پنج ریال»), included in `aria-describedby`.
- **`PersianRangeCalendar`** (inline) and **`PersianDateRangePicker`**
  - Value `{ start: string | null; end: string | null }` (ISO dates); empty is
    `{ start: null, end: null }`. `onValueChange(range, details)` fires on every change,
    including a start without an end.
  - Picking: the first click sets the start; the next click on or after it sets the
    end; a click before the start restarts from that day. The days in between are
    previewed while hovering or moving focus, and marked `data-range-start`,
    `data-in-range`, `data-range-end`; they are `aria-selected`, and the start and end
    days' names say «آغاز بازه» / «پایان بازه». A range may include disabled days.
  - Shared with the single-date components through one internal calendar core: same
    keyboard, holidays, Gregorian days, `min`/`max`/`isDateDisabled`, labels,
    `classNames` (plus `dayRangeStart`, `dayInRange`, `dayRangeEnd`). One month shown.
  - ✔ The picker is one field with two inputs, «از» and «تا», and one calendar button.
    Each input keeps the date picker's typed entry; an end before the start is an error
    (`order` message). The dialog stays open after the start is picked and closes after
    the end. `startName` / `endName` submit the two ISO dates with native forms.

## Testing

Same rules as v1 (both directions, all digit scripts, generated identifiers). Card
numbers in tests and docs are generated from the Luhn rule on a known bank prefix
(`test/generators.ts`), never real ones.
