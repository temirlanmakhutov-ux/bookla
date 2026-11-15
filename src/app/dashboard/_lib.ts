import { localeTag } from "@/lib/time";
import type { Locale } from "@/i18n/locales";

/** Monday-first order used in the hours editor (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekdayName(wd: number, locale: Locale, style: "long" | "short" = "long") {
  // 2024-01-07 was a Sunday
  return new Date(Date.UTC(2024, 0, 7 + wd, 12)).toLocaleDateString(localeTag(locale), { weekday: style, timeZone: "UTC" });
}

const STAFF_COLORS = ["#1238a6", "#d9301a", "#1a7f45", "#8f6400", "#6b3fa0", "#0e7480", "#b83a6f", "#071a44", "#8a4a2f", "#4a587b"];

export function staffColor(staffIds: string[], id: string | null) {
  if (!id) return "#8492b4";
  const i = staffIds.indexOf(id);
  return STAFF_COLORS[(i < 0 ? 0 : i) % STAFF_COLORS.length];
}

export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export const formatDay = (d: Date, locale: Locale) =>
  d.toLocaleDateString(localeTag(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Famagusta" });
