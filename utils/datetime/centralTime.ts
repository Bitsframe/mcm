/**
 * Date/time helpers for a Texas-only business.
 *
 * Every Clinica San Miguel location is in Texas and carries
 * `Locations.timezone = 'America/Chicago'`, so the business day is Central
 * Time everywhere. Formatting without pinning a zone renders in the viewer's
 * browser timezone (and in UTC on the server), which makes the same record
 * show different days depending on where it is read.
 *
 * Do NOT use a fixed -6 offset: that is CST only. From March to November
 * Central is CDT, UTC-5, so a constant offset files anything in the first
 * hour of the day under the previous date. The IANA zone handles the switch.
 *
 * TIMESTAMPS vs DATE-ONLY — these need opposite treatment:
 *   - `timestamptz` columns (order_date, date_sold, created_at, …) describe an
 *     instant. Render them in Central: `formatCtDate` / `formatCtDateTime`.
 *   - `date` columns (allpatients.dob, …) have no time or zone. They parse as
 *     UTC midnight, so shifting them into Central renders the PREVIOUS day.
 *     Render them with `formatDateOnly`, which pins UTC.
 */

export const CT_TIME_ZONE = "America/Chicago";

const CT_YMD = new Intl.DateTimeFormat("en-US", {
  timeZone: CT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toDate = (value: string | number | Date): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** The Central-Time calendar date of an instant, as YYYY-MM-DD. */
export const ctDateString = (date: Date): string => {
  const parts = CT_YMD.formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

/** Today's date in Central Time, as YYYY-MM-DD. */
export const todayInCtDate = (): string => ctDateString(new Date());

/** Convert a UTC/ISO timestamp string to its Central-Time date (YYYY-MM-DD). */
export const convertUTCtoCtDate = (utcDateString: string): string => {
  const date = toDate(utcDateString);
  return date ? ctDateString(date) : "";
};

/** Format a timestamp for display, in Central Time. */
export const formatCtDate = (
  value: string | number | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string => {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: CT_TIME_ZONE }).format(date);
};

/** Format a timestamp with its time of day, in Central Time. */
export const formatCtDateTime = (
  value: string | number | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string => formatCtDate(value, locale, options);

/**
 * Format a DATE-ONLY value (a `date` column such as dob).
 * Pinned to UTC because such values parse as UTC midnight — rendering them in
 * Central would show the previous day.
 */
export const formatDateOnly = (
  value: string | number | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string => {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
};
