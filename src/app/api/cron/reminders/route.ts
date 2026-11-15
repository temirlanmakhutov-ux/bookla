import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { bookingLink } from "@/lib/booking";
import { serviceName } from "@/lib/catalog";
import { hhmm } from "@/lib/time";
import { message } from "@/i18n/messages";
import { isLocale } from "@/i18n/locales";

// Sends WhatsApp reminders ~2 hours before each booking.
// Call every 15 minutes (vercel.json cron). Protected by CRON_SECRET:
//   Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = Date.now();
  const due = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      reminderSentAt: null,
      startsAt: { gt: new Date(now + 60 * 60_000), lte: new Date(now + 2 * 60 * 60_000 + 15 * 60_000) },
      // a client who booked less than 3 hours ahead doesn't need a reminder
      createdAt: { lt: new Date(now - 60 * 60_000) },
    },
    include: { business: true, service: true },
    take: 200,
  });
  let sent = 0;
  for (const b of due) {
    // claim first so parallel runs never double-send
    const claimed = await prisma.booking.updateMany({ where: { id: b.id, reminderSentAt: null }, data: { reminderSentAt: new Date() } });
    if (!claimed.count) continue;
    const lang = isLocale(b.lang) ? b.lang : "tr";
    await notify({
      businessId: b.businessId,
      bookingId: b.id,
      to: b.customerPhone,
      kind: "booking_reminder_client",
      body: message("clientReminder", lang, {
        time: hhmm(b.startMin),
        service: serviceName(b.service, lang),
        business: b.business.name,
        link: bookingLink(b.token),
      }),
    });
    sent++;
  }
  return NextResponse.json({ checked: due.length, sent });
}
