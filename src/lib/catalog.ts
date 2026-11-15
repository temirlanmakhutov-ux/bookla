import type { Locale } from "@/i18n/locales";

// [id, emoji, tr, en, ru]
export const CATEGORIES = [
  ["hair", "✂️", "Kuaför", "Hair salons", "Парикмахерские"],
  ["barber", "💈", "Berber", "Barbers", "Барбершопы"],
  ["nails", "💅", "Manikür", "Nails", "Ногти"],
  ["beauty", "✨", "Kaş & kirpik", "Brows & lashes", "Брови и ресницы"],
  ["massage", "🧖", "Masaj & spa", "Massage & spa", "Массаж и СПА"],
  ["dentist", "🦷", "Diş hekimi", "Dentists", "Стоматологи"],
  ["doctor", "🩺", "Doktor", "Doctors", "Врачи"],
  ["vet", "🐾", "Veteriner", "Vets", "Ветеринары"],
  ["car", "🚗", "Oto servis", "Car care", "Автосервис и мойка"],
  ["rent", "🔑", "Araç kiralama", "Car rental", "Прокат авто"],
  ["food", "🍽️", "Restoran", "Restaurants", "Столик в ресторане"],
  ["tours", "⛵", "Tur & tekne", "Tours & boats", "Туры и яхты"],
  ["sport", "🧘", "Spor & yoga", "Fitness & yoga", "Фитнес и йога"],
  ["edu", "📚", "Özel ders", "Tutors", "Репетиторы"],
  ["photo", "📷", "Fotoğrafçı", "Photographers", "Фотографы"],
  ["home", "🧹", "Ev hizmetleri", "Home services", "Клининг и мастера"],
] as const;

// [id, tr/en, ru]
export const CITIES = [
  ["girne", "Girne", "Кирения"],
  ["lefkosa", "Lefkoşa", "Никосия"],
  ["magusa", "Gazimağusa", "Фамагуста"],
  ["iskele", "İskele", "Искеле"],
  ["guzelyurt", "Güzelyurt", "Гюзельюрт"],
  ["lefke", "Lefke", "Лефке"],
] as const;

export type CategoryId = (typeof CATEGORIES)[number][0];
export type CityId = (typeof CITIES)[number][0];

const LI = { tr: 2, en: 3, ru: 4 } as const;

export const isCategory = (s: unknown): s is CategoryId => CATEGORIES.some((c) => c[0] === s);
export const isCity = (s: unknown): s is CityId => CITIES.some((c) => c[0] === s);

export function categoryName(id: string, locale: Locale) {
  const c = CATEGORIES.find((x) => x[0] === id);
  return c ? c[LI[locale]] : id;
}
export function categoryEmoji(id: string) {
  return CATEGORIES.find((x) => x[0] === id)?.[1] ?? "📍";
}
export function cityName(id: string, locale: Locale) {
  const c = CITIES.find((x) => x[0] === id);
  return c ? (locale === "ru" ? c[2] : c[1]) : id;
}

export function serviceName(s: { nameTr: string; nameEn: string; nameRu: string }, locale: Locale) {
  const v = locale === "ru" ? s.nameRu : locale === "en" ? s.nameEn : s.nameTr;
  return v || s.nameTr;
}

export function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** URL-safe slug from a business name (Turkish letters folded). */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/[а-яё]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Digits only, with Turkish/KKTC country code. "0533 123 45 67" → "905331234567". */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "90" + d.slice(1);
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d;
}

export const waLink = (phone: string, text?: string) =>
  `https://wa.me/${normalizePhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const money = (price: number, locale: Locale, freeLabel: string) =>
  price ? `${price.toLocaleString(locale === "ru" ? "ru-RU" : locale === "en" ? "en-GB" : "tr-TR")} ₺` : freeLabel;
