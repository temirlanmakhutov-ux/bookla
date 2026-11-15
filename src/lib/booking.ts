import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ACTIVE_STATUSES, computeSlots, freeAt } from "./availability";
import { formatDate, hhmm, isDateStr, localToUtc } from "./time";
import { subscriptionState } from "./plans";
import { normalizePhone, serviceName } from "./catalog";
import { notify } from "./notify";
import { message } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/locales";

// Public site address for links in messages and QR codes.
// On Vercel it falls back to the production domain the platform provides.
export const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
export const bookingLink = (token: string) => `${BASE_URL}/booking/${token}`;
export const businessLink = (slug: string) => `${BASE_URL}/b/${slug}`;

const bookingBusinessInclude = {
  hours: true,
  staff: { where: { active: true }, orderBy: [{ sort: "asc" }, { name: "asc" }] },
  services: { where: { active: true }, orderBy: [{ sort: "asc" }, { nameTr: "asc" }] },
  owner: { select: { lang: true } },
} satisfies Prisma.BusinessInclude;

export type BookingBusiness = Prisma.BusinessGetPayload<{ include: typeof bookingBusinessInclude }>;

export function loadBookingBusiness(where: { slug: string } | { id: string }) {
  return prisma.business.findUnique({ where, include: bookingBusinessInclude });
}

type Db = Prisma.TransactionClient | typeof prisma;

function busyFor(db: Db, businessId: string, date: string, excludeId?: string) {
  return db.booking.findMany({
    where: { businessId, date, status: { in: [...ACTIVE_STATUSES] }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { staffId: true, startMin: true, endMin: true },
  });
}

export const canBookOnline = (b: { published: boolean; plan: string; trialEndsAt: Date; paidUntil: Date | null }) =>
  b.published && subscriptionState(b).active;

/** Free start times for the public booking widget. */
export async function getSlots(businessId: string, serviceId: string, date: string, staffId: string | null) {
  if (!isDateStr(date)) return null;
  const biz = await loadBookingBusiness({ id: businessId });
  if (!biz) return null;
  const svc = biz.services.find((s) => s.id === serviceId);
  if (!svc) return null;
  if (!canBookOnline(biz)) return [];
  const busy = await busyFor(prisma, biz.id, date);
  return computeSlots(biz, svc.durationMin, date, busy, staffId).map((s) => ({ start: s.start, time: hhmm(s.start) }));
}

export type CreateBookingInput = {
  businessId: string;
  serviceId: string;
  staffId: string | null;
  date: string;
  startMin: number;
  name: string;
  phone: string;
  note: string;
  lang: string;
};

export type CreateBookingResult = { ok: true; token: string } | { ok: false; error: "invalid" | "unavailable" | "taken" };

/**
 * Creates a booking after re-checking availability inside a transaction.
 * source "manual" = the owner adds a phone / walk-in client from the dashboard:
 * no minimum notice, no horizon limit, works even if the subscription expired.
 */
export async function createBooking(
  input: CreateBookingInput,
  source: "online" | "manual" = "online",
): Promise<CreateBookingResult> {
  const biz = await loadBookingBusiness({ id: input.businessId });
  if (!biz) return { ok: false, error: "invalid" };
  if (source === "online" && !canBookOnline(biz)) return { ok: false, error: "unavailable" };
  const svc = biz.services.find((s) => s.id === input.serviceId);
  const phone = normalizePhone(input.phone);
  const name = input.name.trim().slice(0, 80);
  if (!svc || !isDateStr(input.date) || !Number.isInteger(input.startMin) || name.length < 2 || phone.length < 8) {
    return { ok: false, error: "invalid" };
  }
  if (input.staffId && !biz.staff.some((s) => s.id === input.staffId)) return { ok: false, error: "invalid" };
  const lang: Locale = isLocale(input.lang) ? input.lang : "tr";
  const token = randomBytes(18).toString("base64url");

  // Serializable: two clients racing for the same slot can't both win (on Postgres the loser
  // gets a serialization error, which we report as "taken").
  const booking = await prisma
    .$transaction(async (tx) => {
    const busy = await busyFor(tx, biz.id, input.date);
    // online: only times from the public grid; manual (owner): any time, as long as someone is free
    const slot =
      source === "manual"
        ? freeAt(biz, input.startMin, svc.durationMin, busy, input.staffId)
        : computeSlots(biz, svc.durationMin, input.date, busy, input.staffId).find((s) => s.start === input.startMin);
    if (!slot) return null;
    let staffId: string | null = null;
    if (slot.staffIds.length) {
      if (input.staffId) staffId = input.staffId;
      else {
        // "Anyone": give it to the least loaded specialist of the day
        const load = (id: string) => busy.filter((b) => b.staffId === id).reduce((a, b) => a + b.endMin - b.startMin, 0);
        staffId = [...slot.staffIds].sort((a, b) => load(a) - load(b))[0];
      }
    }
    return tx.booking.create({
      data: {
        token,
        businessId: biz.id,
        serviceId: svc.id,
        staffId,
        date: input.date,
        startMin: input.startMin,
        endMin: input.startMin + svc.durationMin,
        startsAt: localToUtc(input.date, input.startMin),
        customerName: name,
        customerPhone: phone,
        note: input.note.trim().slice(0, 500),
        lang,
        status: "confirmed",
        price: svc.price,
        source,
      },
      include: { staff: true },
    });
  }, { isolationLevel: "Serializable" })
    .catch((e: unknown) => {
      if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2034") return null;
      throw e;
    });
  if (!booking) return { ok: false, error: "taken" };

  try {
    const time = hhmm(booking.startMin);
    await notify({
      businessId: biz.id,
      bookingId: booking.id,
      to: phone,
      kind: "booking_confirmed_client",
      body: message("clientConfirmed", lang, {
        service: serviceName(svc, lang),
        business: biz.name,
        date: formatDate(booking.date, lang),
        time,
        link: bookingLink(token),
      }),
    });
    if (source === "online") {
      const ol: Locale = isLocale(biz.owner?.lang) ? biz.owner.lang : "tr";
      await notify({
        businessId: biz.id,
        bookingId: booking.id,
        to: biz.phone,
        kind: "booking_new_owner",
        body: message("ownerNew", ol, {
          customer: name,
          phone: `+${phone}`,
          service: serviceName(svc, ol),
          date: formatDate(booking.date, ol),
          time,
          staff: booking.staff ? ` · ${booking.staff.name}` : "",
        }),
      });
    }
  } catch (e) {
    console.error("notify failed", e);
  }
  return { ok: true, token };
}

export async function getBookingByToken(token: string) {
  return prisma.booking.findUnique({
    where: { token },
    include: { business: true, service: true, staff: true },
  });
}

export function canClientCancel(b: { status: string; startsAt: Date }, cancelHours: number, now = new Date()) {
  return (
    (ACTIVE_STATUSES as readonly string[]).includes(b.status) &&
    b.startsAt.getTime() - now.getTime() >= cancelHours * 3_600_000
  );
}

export async function cancelByClient(token: string): Promise<"ok" | "not_found" | "too_late"> {
  const b = await prisma.booking.findUnique({
    where: { token },
    include: { business: { include: { owner: { select: { lang: true } } } }, service: true },
  });
  if (!b) return "not_found";
  if (b.status === "cancelled") return "ok";
  if (!canClientCancel(b, b.business.cancelHours)) return "too_late";
  await prisma.booking.update({ where: { id: b.id }, data: { status: "cancelled", cancelledBy: "client" } });
  try {
    const ol: Locale = isLocale(b.business.owner?.lang) ? b.business.owner.lang : "tr";
    await notify({
      businessId: b.businessId,
      bookingId: b.id,
      to: b.business.phone,
      kind: "booking_cancelled_owner",
      body: message("ownerCancelled", ol, {
        customer: b.customerName,
        service: serviceName(b.service, ol),
        date: formatDate(b.date, ol),
        time: hhmm(b.startMin),
      }),
    });
  } catch (e) {
    console.error("notify failed", e);
  }
  return "ok";
}

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Owner changes a booking status from the dashboard. Always pass the owner's businessId. */
export async function setBookingStatus(businessId: string, bookingId: string, status: BookingStatus) {
  const b = await prisma.booking.findFirst({
    where: { id: bookingId, businessId },
    include: { business: true, service: true },
  });
  if (!b) return false;
  await prisma.booking.update({
    where: { id: b.id },
    data: { status, cancelledBy: status === "cancelled" ? "business" : b.cancelledBy },
  });
  if (status === "cancelled" && b.status !== "cancelled") {
    const lang: Locale = isLocale(b.lang) ? b.lang : "tr";
    try {
      await notify({
        businessId,
        bookingId: b.id,
        to: b.customerPhone,
        kind: "booking_cancelled_client",
        body: message("clientCancelled", lang, {
          service: serviceName(b.service, lang),
          business: b.business.name,
          date: formatDate(b.date, lang),
          time: hhmm(b.startMin),
        }),
      });
    } catch (e) {
      console.error("notify failed", e);
    }
  }
  return true;
}
