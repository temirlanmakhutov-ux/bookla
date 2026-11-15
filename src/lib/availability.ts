import { addDays, nowLocal, weekdayOf } from "./time";

export type AvailabilityBusiness = {
  slotStep: number;
  minNoticeMin: number;
  maxDaysAhead: number;
  capacity: number;
  hours: { weekday: number; openMin: number; closeMin: number }[];
  staff: { id: string; active: boolean }[];
};

export type BusyInterval = { staffId: string | null; startMin: number; endMin: number };

/** A start time and the staff members free for the whole service (empty for businesses without staff). */
export type Slot = { start: number; staffIds: string[] };

export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export function isOpenDay(biz: Pick<AvailabilityBusiness, "hours">, date: string) {
  const wd = weekdayOf(date);
  return biz.hours.some((h) => h.weekday === wd);
}

export function isBookableDate(biz: Pick<AvailabilityBusiness, "maxDaysAhead">, date: string, now = nowLocal()) {
  return date >= now.date && date <= addDays(now.date, biz.maxDaysAhead);
}

/**
 * Who is free for an arbitrary start time (ignores the opening-hours grid).
 * Used for manual bookings the owner adds from the dashboard.
 * Returns null when nobody / no place is free.
 */
export function freeAt(
  biz: Pick<AvailabilityBusiness, "capacity" | "staff">,
  start: number,
  durationMin: number,
  busy: BusyInterval[],
  staffId?: string | null,
): Slot | null {
  const end = start + durationMin;
  if (start < 0 || end > 24 * 60) return null;
  const overlaps = (b: BusyInterval) => b.startMin < end && start < b.endMin;
  const activeStaff = biz.staff.filter((s) => s.active).map((s) => s.id);
  if (activeStaff.length === 0) {
    return busy.filter(overlaps).length < Math.max(1, biz.capacity) ? { start, staffIds: [] } : null;
  }
  if (busy.some((b) => b.staffId === null && overlaps(b))) return null;
  const candidates = staffId ? activeStaff.filter((id) => id === staffId) : activeStaff;
  const free = candidates.filter((id) => !busy.some((b) => b.staffId === id && overlaps(b)));
  return free.length ? { start, staffIds: free } : null;
}

/**
 * Free start times for one service on one date.
 * - staffId given: only that person; null/undefined: anyone free.
 * - Businesses without staff use `capacity` parallel places (tables, cars, boats…).
 */
export function computeSlots(
  biz: AvailabilityBusiness,
  durationMin: number,
  date: string,
  busy: BusyInterval[],
  staffId?: string | null,
  now = nowLocal(),
): Slot[] {
  if (!isBookableDate(biz, date, now)) return [];
  const wd = weekdayOf(date);
  const intervals = biz.hours.filter((h) => h.weekday === wd).sort((a, b) => a.openMin - b.openMin);
  const activeStaff = biz.staff.filter((s) => s.active).map((s) => s.id);
  const noStaff = activeStaff.length === 0;
  const candidates = staffId ? activeStaff.filter((id) => id === staffId) : activeStaff;
  if (!noStaff && candidates.length === 0) return [];

  const step = Math.max(5, biz.slotStep);
  const out: Slot[] = [];
  for (const iv of intervals) {
    for (let m = iv.openMin; m + durationMin <= iv.closeMin; m += step) {
      if (date === now.date && m < now.minutes + biz.minNoticeMin) continue;
      const end = m + durationMin;
      const overlaps = (b: BusyInterval) => b.startMin < end && m < b.endMin;
      if (noStaff) {
        if (busy.filter(overlaps).length < Math.max(1, biz.capacity)) out.push({ start: m, staffIds: [] });
      } else {
        // a booking without staff (made before staff existed) blocks everybody
        if (busy.some((b) => b.staffId === null && overlaps(b))) continue;
        const free = candidates.filter((id) => !busy.some((b) => b.staffId === id && overlaps(b)));
        if (free.length) out.push({ start: m, staffIds: free });
      }
    }
  }
  return out;
}
