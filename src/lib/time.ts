// All business times are local to Northern Cyprus.
// Dates are stored as "YYYY-MM-DD" strings and times as minutes from midnight,
// so availability maths never depends on the server's own time zone.

export const TZ = "Asia/Famagusta";

const dtf = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parts(d: Date) {
  const o: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) o[p.type] = p.value;
  return o;
}

/** Current local date and minutes since midnight in Northern Cyprus. */
export function nowLocal(d: Date = new Date()) {
  const p = parts(d);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const todayLocal = () => nowLocal().date;

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Converts a local date + minutes in Northern Cyprus to a UTC instant. */
export function localToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const offset = (t: number) => {
    const p = parts(new Date(t));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = guess - offset(guess);
  t = guess - offset(t); // second pass settles DST edges
  return new Date(t);
}

export const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v <= 24 * 60 && Number(m[2]) < 60 ? v : null;
}

export const isDateStr = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const LOCALE_TAG = { tr: "tr-TR", en: "en-GB", ru: "ru-RU" } as const;

/** Formats a "YYYY-MM-DD" date for display. */
export function formatDate(
  date: string,
  locale: keyof typeof LOCALE_TAG,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "long" },
) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(LOCALE_TAG[locale], { ...opts, timeZone: "UTC" });
}

export const localeTag = (locale: keyof typeof LOCALE_TAG) => LOCALE_TAG[locale];
