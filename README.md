# @amirjaz/persian-ui

**React components and utilities for Persian apps, with the hard parts done right:**
numbers that stay in order inside Persian text, Jalali date and range pickers, inputs
for Iranian IDs and bank cards, and search that finds what users meant.

![A Persian loan form: users type national ID, mobile, bank card (the field names the bank), amount (shown in words) and birth date in Persian digits, and the server receives clean Latin-digit values](https://raw.githubusercontent.com/Amirjaz/persian-ui/main/docs/images/hero.png)

- **Persian on screen, clean data in your code.** Inputs format as the user types or
  pastes, in Persian, Arabic or Latin digits, and give you normalized values with real
  checksums verified. Card and Sheba fields name the bank as it's typed, and amounts
  can be shown in words.
- **Right-to-left done right.** Logical CSS only, and every component is tested in
  right-to-left, left-to-right and nested pages, including in a real browser.
- **Accessible.** WAI-ARIA grid and dialog patterns, full keyboard support, and errors
  announced to screen readers in Persian.
- **Small.** Zero dependencies, tree-shakeable, React 18 and 19, server-rendering safe.
  The validators run on your server too.

## Quick start

```bash
pnpm add @amirjaz/persian-ui
```

```tsx
import "@amirjaz/persian-ui/styles.css";
import { MobileInput, NationalIdInput, PersianDatePicker } from "@amirjaz/persian-ui";

export function SignUpForm() {
  return (
    <form action="/api/sign-up" method="post" dir="rtl">
      <NationalIdInput name="nationalId" label="کد ملی" required />
      <MobileInput name="mobile" label="تلفن همراه" required />
      <PersianDatePicker name="birthDate" label="تاریخ تولد" />
      <button type="submit">ثبت‌نام</button>
    </form>
  );
}
```

## Numbers stay in order

Inside a Persian sentence the browser's bidi algorithm reverses tracking codes,
ranges and phone numbers. It depends on the surrounding letters, so it slips through
code review. `<PersianText>` isolates every left-to-right run:

![The same three text messages. As plain text the tracking code reads 3321-0715-1404, the range 20-10 and the phone number 6789 345 912 98+. With PersianText all three keep their order](https://raw.githubusercontent.com/Amirjaz/persian-ui/main/docs/images/bidi.png)

## Search finds what users meant

Text typed on an Arabic keyboard uses «ي» and «ك», which look like «ی» and «ک» but
are different characters. Add diacritics, ZWNJ and three digit scripts, and
`includes()` misses real matches:

![Searching contacts for «علی»: includes() finds 2 of 5, missing names written with Arabic letters or a diacritic; normalizePersian in search mode finds all 5](https://raw.githubusercontent.com/Amirjaz/persian-ui/main/docs/images/search.png)

```ts
import { fixKeyboardLayout, normalizePersian } from "@amirjaz/persian-ui/core";

const key = (text: string) => normalizePersian(text, { mode: "search" });
key("علي") === key("علی"); // true (Arabic ي, Persian ی)

fixKeyboardLayout("sghl", "fa"); // "سلام": typed with the English layout still on
```

## Date pickers that know the calendar

Single dates or ranges, with Iranian holidays, optional Gregorian days, and keyboard
navigation that follows the reading direction. Values are time-zone-free ISO strings
(`"2025-03-21"`), so a date never arrives at your server a day early. Restyle them
with CSS variables:

![The date range picker open in a right-to-left page with 10 to 16 Farvardin selected, the calendar in dark mode with Gregorian days, and in a custom teal theme in a left-to-right page](https://raw.githubusercontent.com/Amirjaz/persian-ui/main/docs/images/themes.png)

## What's inside

| For | Use |
|---|---|
| Jalali dates and ranges | `PersianDatePicker`, `PersianCalendar`, `PersianDateRangePicker`, `PersianRangeCalendar` |
| Iranian IDs and bank cards | `NationalIdInput`, `MobileInput`, `ShebaInput`, `CardNumberInput` |
| Prices in toman or rial | `PriceInput` (optionally with the amount in words) |
| Mixed-direction text | `PersianText`, `DirectionProvider` |
| Validation, also on the server | `validateNationalId`, `validateIranianMobile`, `validateSheba`, `validateCardNumber`, `validatePostalCode`, `validatePlate` |
| Banks | `getBankFromCardNumber`, `getBankFromSheba`, `IRANIAN_BANKS` |
| Date helpers | `toJalali`, `toGregorian`, `formatJalali`, `parseJalali` |
| Text and money | `normalizePersian`, `fixKeyboardLayout`, `toPersianDigits`, `toEnglishDigits`, `formatToman`, `formatRial`, `numberToWords` |

Components come from `@amirjaz/persian-ui`, functions from `@amirjaz/persian-ui/core`
(no React needed, so they work in Server Components and server actions).

**[Full documentation →](https://github.com/Amirjaz/persian-ui/blob/main/docs/API.md)**
every prop, validator and CSS variable, plus Next.js, Tailwind, dark mode and
shadcn/ui setup.

## Contributing

`pnpm install`, then `pnpm dev` for a playground with every component in both
directions, and `pnpm check` to run types, lint, tests (React 18, 19 and a real
browser) and the build.

## License

MIT. Jalali conversion ported from [jalaali-js](https://github.com/jalaali/jalaali-js)
(MIT, © Behrang Norouzinia). The date picker grew out of
[Shamsi-Calendar](https://github.com/Amirjaz/Shamsi-Calendar).
