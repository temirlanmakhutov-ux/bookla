import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { CATEGORIES, CITIES } from "./catalog";
import { addDays, nowLocal } from "./time";
import { ACTIVE_STATUSES, computeSlots, type AvailabilityBusiness } from "./availability";

/** Businesses that clients can see: published and with an active trial or paid subscription. */
export const visibleWhere = (now = new Date()): Prisma.BusinessWhereInput => ({
  published: true,
  OR: [{ trialEndsAt: { gt: now } }, { paidUntil: { gt: now } }],
});

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export type ListingCard = {
  slug: string;
  name: string;
  color: string;
  category: string;
  city: string;
  area: string;
  rating: number | null;
  ratingCount: number;
  minPrice: number | null;
  languages: string[];
  /** Closing time in minutes when the place is open right now, otherwise null. */
  openUntil: number | null;
};

export async function listBusinesses(opts: { cat?: string; city?: string; q?: string; take?: number }) {
  const where: Prisma.BusinessWhereInput = {
    ...visibleWhere(),
    ...(opts.cat ? { category: opts.cat } : {}),
    ...(opts.city ? { city: opts.city } : {}),
  };
  const rows = await prisma.business.findMany({
    where,
    include: {
      hours: true,
      services: { where: { active: true }, select: { price: true, nameTr: true, nameEn: true, nameRu: true } },
    },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }],
  });

  let list = rows;
  const q = opts.q?.trim();
  if (q) {
    const n = norm(q);
    list = rows.filter((b) => {
      const cat = CATEGORIES.find((c) => c[0] === b.category);
      const city = CITIES.find((c) => c[0] === b.city);
      const hay = [b.name, b.area, b.about, ...(cat ? cat.slice(2) : []), ...(city ? city.slice(1) : []), ...b.services.flatMap((s) => [s.nameTr, s.nameEn, s.nameRu])].join(" ");
      return norm(hay).includes(n);
    });
  }
  const now = nowLocal();
  return list.slice(0, opts.take ?? 200).map<ListingCard>((b) => {
    const st = openState(b.hours, now);
    const prices = b.services.map((s) => s.price).filter((p) => p > 0);
    return {
      slug: b.slug,
      name: b.name,
      color: b.color,
      category: b.category,
      city: b.city,
      area: b.area,
      rating: b.rating,
      ratingCount: b.ratingCount,
      minPrice: prices.length ? Math.min(...prices) : null,
      languages: b.languages.split(",").filter(Boolean),
      openUntil: st.open ? st.until : null,
    };
  });
}

/** "Open until 20:00" / closed, from working hours. */
export function openState(hours: { weekday: number; openMin: number; closeMin: number }[], now = nowLocal()) {
  const [y, m, d] = now.date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const iv = hours.find((h) => h.weekday === wd && h.openMin <= now.minutes && now.minutes < h.closeMin);
  return iv ? { open: true as const, until: iv.closeMin } : { open: false as const };
}

/** One row of the public board: the soonest free start time of a place's first service. */
export type BoardRow = {
  slug: string;
  business: string;
  area: string;
  city: string;
  serviceId: string;
  service: { nameTr: string; nameEn: string; nameRu: string };
  price: number;
  date: string;
  start: number;
};

/** Soonest real free times across visible places, one row per place, earliest first. */
export async function soonestFree(opts: { take?: number; cat?: string; city?: string } = {}): Promise<BoardRow[]> {
  const now = nowLocal();
  const places = await prisma.business.findMany({
    where: { ...visibleWhere(), ...(opts.cat ? { category: opts.cat } : {}), ...(opts.city ? { city: opts.city } : {}) },
    include: {
      hours: true,
      staff: { where: { active: true } },
      services: { where: { active: true }, orderBy: [{ sort: "asc" }, { nameTr: "asc" }], take: 1 },
    },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }],
    take: 30,
  });
  if (places.length === 0) return [];
  const days = [0, 1, 2, 3].map((n) => addDays(now.date, n));
  const busy = await prisma.booking.findMany({
    where: { businessId: { in: places.map((p) => p.id) }, date: { in: days }, status: { in: [...ACTIVE_STATUSES] } },
    select: { businessId: true, date: true, staffId: true, startMin: true, endMin: true },
  });
  const rows: BoardRow[] = [];
  for (const p of places) {
    const svc = p.services[0];
    if (!svc) continue;
    for (const date of days) {
      const taken = busy.filter((b) => b.businessId === p.id && b.date === date);
      const first = computeSlots(p, svc.durationMin, date, taken, null, now)[0];
      if (!first) continue;
      rows.push({
        slug: p.slug,
        business: p.name,
        area: p.area,
        city: p.city,
        serviceId: svc.id,
        service: { nameTr: svc.nameTr, nameEn: svc.nameEn, nameRu: svc.nameRu },
        price: svc.price,
        date,
        start: first.start,
      });
      break;
    }
  }
  rows.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));
  return rows.slice(0, opts.take ?? 5);
}

/** How many visible places each category has. */
export async function categoryCounts(): Promise<Record<string, number>> {
  const groups = await prisma.business.groupBy({ by: ["category"], where: visibleWhere(), _count: { _all: true } });
  return Object.fromEntries(groups.map((g) => [g.category, g._count._all]));
}

/** Soonest free start per service of one business (looks `span` days ahead). Feeds the timetable on the business page. */
export async function soonestByService(
  b: AvailabilityBusiness & { id: string; services: { id: string; durationMin: number }[] },
  span = 5,
): Promise<Record<string, { date: string; start: number }>> {
  const now = nowLocal();
  const days = Array.from({ length: Math.min(span, b.maxDaysAhead + 1) }, (_, n) => addDays(now.date, n));
  const busy = await prisma.booking.findMany({
    where: { businessId: b.id, date: { in: days }, status: { in: [...ACTIVE_STATUSES] } },
    select: { date: true, staffId: true, startMin: true, endMin: true },
  });
  const out: Record<string, { date: string; start: number }> = {};
  for (const svc of b.services) {
    for (const date of days) {
      const first = computeSlots(b, svc.durationMin, date, busy.filter((x) => x.date === date), null, now)[0];
      if (first) {
        out[svc.id] = { date, start: first.start };
        break;
      }
    }
  }
  return out;
}
