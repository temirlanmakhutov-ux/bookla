// WhatsApp message texts (client gets their booking language, owner gets Owner.lang).
import { fmt, type Locale } from "./locales";

type V = Record<string, string | number>;

const T = {
  clientConfirmed: {
    tr: "✅ Randevunuz alındı: {service} — {business}, {date} {time}.\nDetay ve iptal: {link}",
    en: "✅ You’re booked: {service} at {business}, {date} {time}.\nDetails & cancel: {link}",
    ru: "✅ Вы записаны: {service} — {business}, {date} в {time}.\nДетали и отмена: {link}",
  },
  clientPending: {
    tr: "🕐 Talebiniz alındı: {service} — {business}, {date} {time}. İşletme onayladığında haber vereceğiz.\n{link}",
    en: "🕐 Request received: {service} at {business}, {date} {time}. We’ll let you know when it’s confirmed.\n{link}",
    ru: "🕐 Заявка принята: {service} — {business}, {date} в {time}. Сообщим, когда подтвердят.\n{link}",
  },
  clientCancelled: {
    tr: "❌ Randevunuz iptal edildi: {service} — {business}, {date} {time}.",
    en: "❌ Your booking was cancelled: {service} at {business}, {date} {time}.",
    ru: "❌ Запись отменена: {service} — {business}, {date} в {time}.",
  },
  clientReminder: {
    tr: "⏰ Hatırlatma: bugün {time}’de {service} — {business}.\nİptal etmeniz gerekirse: {link}",
    en: "⏰ Reminder: {service} at {business} today at {time}.\nNeed to cancel? {link}",
    ru: "⏰ Напоминание: сегодня в {time} — {service}, {business}.\nЕсли нужно отменить: {link}",
  },
  ownerNew: {
    tr: "🆕 Yeni randevu: {customer} ({phone}) — {service}, {date} {time}{staff}.",
    en: "🆕 New booking: {customer} ({phone}) — {service}, {date} {time}{staff}.",
    ru: "🆕 Новая запись: {customer} ({phone}) — {service}, {date} в {time}{staff}.",
  },
  ownerCancelled: {
    tr: "❌ Müşteri iptal etti: {customer} — {service}, {date} {time}.",
    en: "❌ Client cancelled: {customer} — {service}, {date} {time}.",
    ru: "❌ Клиент отменил запись: {customer} — {service}, {date} в {time}.",
  },
} as const;

export type MessageKind = keyof typeof T;

export function message(kind: MessageKind, locale: Locale, vars: V) {
  return fmt(T[kind][locale], vars);
}
