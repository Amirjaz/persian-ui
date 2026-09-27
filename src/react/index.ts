// Components entry: "@amirjaz/persian-ui". Pure functions live in
// "@amirjaz/persian-ui/core" and are deliberately not re-exported here: this
// entry is marked "use client", so re-exporting them would turn them into
// client references for React Server Components. Types are safe to share.
export type { Digits, JalaliDate } from "@amirjaz/persian-ui/core";

export { DirectionProvider, useDirection } from "./direction";
export type { Direction, DirectionProviderProps } from "./direction";

export { PersianText } from "./persian-text/PersianText";
export type { PersianTextProps } from "./persian-text/PersianText";

export { NationalIdInput } from "./inputs/NationalIdInput";
export type { NationalIdInputProps } from "./inputs/NationalIdInput";
export { MobileInput } from "./inputs/MobileInput";
export type { MobileInputProps } from "./inputs/MobileInput";
export { ShebaInput } from "./inputs/ShebaInput";
export type { ShebaInputProps } from "./inputs/ShebaInput";
export { CardNumberInput } from "./inputs/CardNumberInput";
export type { CardNumberInputProps } from "./inputs/CardNumberInput";
export type { BankInputProps, MaskedInputBaseProps, ValidatedInputProps } from "./field/ValidatedInput";

export { PriceInput } from "./price-input/PriceInput";
export type {
  PriceChangeDetails,
  PriceInputLabels,
  PriceInputProps,
  PriceUnit,
} from "./price-input/PriceInput";

export { PersianCalendar } from "./calendar/PersianCalendar";
export type { PersianCalendarProps } from "./calendar/PersianCalendar";
export type {
  CalendarBaseProps,
  CalendarClassNames,
  DateChangeDetails,
  RangeCalendarClassNames,
  YearRange,
} from "./calendar/CalendarCore";
export { PersianRangeCalendar } from "./calendar/PersianRangeCalendar";
export type { DateRange, PersianRangeCalendarProps, RangeChangeDetails } from "./calendar/PersianRangeCalendar";
export type { JalaliMonth } from "./calendar/dates";
export type { CalendarLabels, RangeCalendarLabels } from "./calendar/labels";

export { PersianDatePicker } from "./date-picker/PersianDatePicker";
export type {
  DatePickerClassNames,
  DatePickerLabels,
  DatePickerMessages,
  PersianDatePickerProps,
} from "./date-picker/PersianDatePicker";

export { PersianDateRangePicker } from "./date-picker/PersianDateRangePicker";
export type {
  DateRangePickerClassNames,
  DateRangePickerLabels,
  DateRangePickerMessages,
  PersianDateRangePickerProps,
} from "./date-picker/PersianDateRangePicker";
