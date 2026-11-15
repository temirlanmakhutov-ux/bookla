export const LOCALES = ["tr", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "lang";

export const isLocale = (s: unknown): s is Locale => LOCALES.includes(s as Locale);

export type PluralForms = { one: string; other: string; few?: string; many?: string };

/** Picks the right plural form ("1 запись", "2 записи", "5 записей") and fills {n}. */
export function plural(locale: Locale, n: number, forms: PluralForms) {
  const rule = new Intl.PluralRules(locale).select(n) as keyof PluralForms;
  return fmt(forms[rule] ?? forms.other, { n });
}

/** Replaces {name} placeholders. */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
