import { type NextRequest } from "next/server";
import { bookingLink, getBookingByToken } from "@/lib/booking";
import { cityName, serviceName } from "@/lib/catalog";
import { isLocale } from "@/i18n/locales";

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

// GET /booking/<token>/ics — calendar file for the client.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bk = await getBookingByToken(token);
  if (!bk) return new Response("Not found", { status: 404 });
  const lang = isLocale(bk.lang) ? bk.lang : "tr";
  const end = new Date(bk.startsAt.getTime() + (bk.endMin - bk.startMin) * 60_000);
  const b = bk.business;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bookla//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${bk.id}@bookla`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(bk.startsAt)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${esc(`${serviceName(bk.service, lang)} — ${b.name}`)}`,
    `LOCATION:${esc([b.address || b.area, cityName(b.city, lang)].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(bookingLink(bk.token))}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(b.name)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookla-${b.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
