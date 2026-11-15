"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { BOOKING_STATUSES, createBooking, setBookingStatus, type BookingStatus } from "@/lib/booking";
import { isCategory, isCity, normalizePhone, slugify } from "@/lib/catalog";
import { staffLimit } from "@/lib/plans";
import { isDateStr, parseHHMM } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { fmt } from "@/i18n/locales";
import type { ActionState } from "@/components/dashboard/forms";
import { WEEK_ORDER, weekdayName } from "./_lib";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const raw = str(fd, k);
  if (raw === "") return NaN;
  const v = Number(raw);
  return Number.isFinite(v) ? Math.round(v) : NaN;
};
const inRange = (v: number, min: number, max: number) => Number.isInteger(v) && v >= min && v <= max;

async function ctx() {
  const { owner, business } = await requireBusiness();
  const locale = await getLocale();
  return { owner, business, locale, t: dashboardDict[locale] };
}

const refresh = () => revalidatePath("/dashboard", "layout");

/* ---------- bookings ---------- */

export async function setStatusAction(bookingId: string, status: BookingStatus) {
  const { business } = await ctx();
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) return;
  await setBookingStatus(business.id, bookingId, status);
  refresh();
}

export async function addManualBookingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, locale, t } = await ctx();
  const date = str(fd, "date");
  const startMin = parseHHMM(str(fd, "time"));
  if (!isDateStr(date) || startMin == null) return { error: t.common.invalid };
  const r = await createBooking(
    {
      businessId: business.id,
      serviceId: str(fd, "serviceId"),
      staffId: str(fd, "staffId") || null,
      date,
      startMin,
      name: str(fd, "name"),
      phone: str(fd, "phone"),
      note: str(fd, "note"),
      lang: locale,
    },
    "manual",
  );
  if (!r.ok) return { error: r.error === "taken" ? t.manual.taken : t.common.invalid };
  refresh();
  return { ok: t.manual.added };
}

/* ---------- services ---------- */

function parseService(fd: FormData, t: (typeof dashboardDict)["tr"]) {
  const nameTr = str(fd, "nameTr").slice(0, 80);
  const durationMin = num(fd, "durationMin");
  const price = num(fd, "price");
  const sort = num(fd, "sort");
  if (!nameTr) return { error: t.services.errName };
  if (!inRange(durationMin, 5, 720)) return { error: t.services.errDuration };
  if (!inRange(price, 0, 10_000_000)) return { error: t.services.errPrice };
  return {
    data: {
      nameTr,
      nameEn: str(fd, "nameEn").slice(0, 80),
      nameRu: str(fd, "nameRu").slice(0, 80),
      durationMin,
      price,
      sort: Number.isInteger(sort) ? sort : 0,
    },
  };
}

export async function addServiceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, t } = await ctx();
  const p = parseService(fd, t);
  if (!p.data) return { error: p.error };
  await prisma.service.create({ data: { ...p.data, businessId: business.id } });
  refresh();
  return { ok: t.common.saved };
}

export async function updateServiceAction(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, t } = await ctx();
  const p = parseService(fd, t);
  if (!p.data) return { error: p.error };
  const r = await prisma.service.updateMany({ where: { id, businessId: business.id }, data: p.data });
  if (!r.count) return { error: t.common.invalid };
  refresh();
  return { ok: t.common.saved };
}

export async function toggleServiceAction(id: string) {
  const { business } = await ctx();
  const s = await prisma.service.findFirst({ where: { id, businessId: business.id }, select: { active: true } });
  if (!s) return;
  await prisma.service.update({ where: { id }, data: { active: !s.active } });
  refresh();
}

export async function deleteServiceAction(id: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  void _fd;
  const { business, t } = await ctx();
  const s = await prisma.service.findFirst({ where: { id, businessId: business.id }, include: { _count: { select: { bookings: true } } } });
  if (!s) return { error: t.common.invalid };
  if (s._count.bookings > 0) {
    await prisma.service.update({ where: { id }, data: { active: false } });
    refresh();
    return { ok: t.services.hiddenInstead };
  }
  await prisma.service.delete({ where: { id } });
  refresh();
  return { ok: t.services.deleted };
}

/* ---------- staff ---------- */

async function activeStaffCount(businessId: string) {
  return prisma.staff.count({ where: { businessId, active: true } });
}

export async function addStaffAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, t } = await ctx();
  const name = str(fd, "name").slice(0, 40);
  if (!name) return { error: t.staff.errName };
  const limit = staffLimit(business);
  if ((await activeStaffCount(business.id)) >= limit) return { error: fmt(t.staff.limitReached, { n: limit }) };
  const last = await prisma.staff.findFirst({ where: { businessId: business.id }, orderBy: { sort: "desc" }, select: { sort: true } });
  await prisma.staff.create({ data: { businessId: business.id, name, sort: (last?.sort ?? -1) + 1 } });
  refresh();
  return { ok: t.common.saved };
}

export async function renameStaffAction(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, t } = await ctx();
  const name = str(fd, "name").slice(0, 40);
  if (!name) return { error: t.staff.errName };
  const r = await prisma.staff.updateMany({ where: { id, businessId: business.id }, data: { name } });
  if (!r.count) return { error: t.common.invalid };
  refresh();
  return { ok: t.common.saved };
}

export async function toggleStaffAction(id: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  void _fd;
  const { business, t } = await ctx();
  const s = await prisma.staff.findFirst({ where: { id, businessId: business.id }, select: { active: true } });
  if (!s) return { error: t.common.invalid };
  if (!s.active) {
    const limit = staffLimit(business);
    if ((await activeStaffCount(business.id)) >= limit) return { error: fmt(t.staff.limitReached, { n: limit }) };
  }
  await prisma.staff.update({ where: { id }, data: { active: !s.active } });
  refresh();
  return undefined;
}

/* ---------- hours ---------- */

export async function saveHoursAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, locale, t } = await ctx();
  const rows: { businessId: string; weekday: number; openMin: number; closeMin: number }[] = [];
  for (const wd of WEEK_ORDER) {
    if (fd.get(`works-${wd}`) !== "on") continue;
    const openMin = parseHHMM(str(fd, `open-${wd}`));
    const closeMin = parseHHMM(str(fd, `close-${wd}`));
    if (openMin == null || closeMin == null || openMin >= closeMin) {
      return { error: fmt(t.hours.errRange, { day: weekdayName(wd, locale) }) };
    }
    rows.push({ businessId: business.id, weekday: wd, openMin, closeMin });
  }
  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { businessId: business.id } }),
    prisma.workingHours.createMany({ data: rows }),
  ]);
  refresh();
  return { ok: t.common.saved };
}

/* ---------- profile ---------- */

const LANGS = ["TR", "EN", "RU"] as const;

export async function saveProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { business, t } = await ctx();
  const p = t.profile;
  const name = str(fd, "name").slice(0, 80);
  const category = str(fd, "category");
  const city = str(fd, "city");
  if (!name || !isCategory(category) || !isCity(city)) return { error: p.errRequired };

  const phone = normalizePhone(str(fd, "phone"));
  if (phone.length < 10 || phone.length > 15) return { error: p.errPhone };

  const langs = fd.getAll("languages").map(String).filter((l): l is (typeof LANGS)[number] => (LANGS as readonly string[]).includes(l));
  if (!langs.length) return { error: p.errLanguages };

  const slug = slugify(str(fd, "slug"));
  if (slug.length < 3) return { error: p.errSlug };
  const clash = await prisma.business.findFirst({ where: { slug, id: { not: business.id } }, select: { id: true } });
  if (clash) return { error: p.errSlugTaken };

  const color = /^#[0-9a-f]{6}$/i.test(str(fd, "color")) ? str(fd, "color") : business.color;
  const capacity = num(fd, "capacity");
  const slotStep = num(fd, "slotStep");
  const minNoticeMin = num(fd, "minNoticeMin");
  const maxDaysAhead = num(fd, "maxDaysAhead");
  const cancelHours = num(fd, "cancelHours");
  if (
    !inRange(capacity, 1, 100) ||
    ![15, 30, 60].includes(slotStep) ||
    !inRange(minNoticeMin, 0, 2880) ||
    !inRange(maxDaysAhead, 1, 365) ||
    !inRange(cancelHours, 0, 168)
  ) {
    return { error: t.common.invalid };
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name,
      category,
      city,
      area: str(fd, "area").slice(0, 80),
      address: str(fd, "address").slice(0, 200),
      phone,
      about: str(fd, "about").slice(0, 1000),
      languages: LANGS.filter((l) => langs.includes(l)).join(","),
      color,
      slug,
      capacity,
      slotStep,
      minNoticeMin,
      maxDaysAhead,
      cancelHours,
      published: fd.get("published") === "on",
    },
  });
  refresh();
  return { ok: t.common.saved };
}
