import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { bookingLink, businessLink } from "@/lib/booking";
import { money, serviceName, waLink } from "@/lib/catalog";
import { addDays, formatDate, hhmm, isDateStr, nowLocal, todayLocal } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { common } from "@/i18n/common";
import { fmt, isLocale, plural } from "@/i18n/locales";
import { message } from "@/i18n/messages";
import { ConfirmSubmit, CopyButton, SubmitButton } from "@/components/dashboard/forms";
import { Icon } from "@/components/icons";
import { ManualBookingForm } from "@/components/dashboard/ManualBookingForm";
import { addManualBookingAction, setStatusAction } from "./actions";
import { staffColor } from "./_lib";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_CHIP: Record<string, string> = {
  pending: "chip chip-chalk",
  confirmed: "chip",
  completed: "chip chip-ok",
  no_show: "chip chip-danger",
  cancelled: "chip chip-gray",
};

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ date?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const c = common[locale];
  const today = todayLocal();
  const date = isDateStr(sp.date) ? sp.date : today;

  const [bookings, services, allStaff, hours] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id, date },
      include: { service: true, staff: true },
      orderBy: [{ startMin: "asc" }, { createdAt: "asc" }],
    }),
    prisma.service.findMany({ where: { businessId: business.id, active: true }, orderBy: [{ sort: "asc" }, { nameTr: "asc" }] }),
    prisma.staff.findMany({ where: { businessId: business.id }, orderBy: [{ sort: "asc" }, { name: "asc" }] }),
    prisma.workingHours.findMany({ where: { businessId: business.id }, select: { weekday: true, openMin: true, closeMin: true } }),
  ]);

  const staffIds = allStaff.map((s) => s.id);
  const activeStaff = allStaff.filter((s) => s.active);
  const live = bookings.filter((b) => b.status !== "cancelled");
  const revenue = live.filter((b) => b.status !== "no_show").reduce((a, b) => a + b.price, 0);
  const link = businessLink(business.slug);

  const now = nowLocal();
  const nextUp = date === today ? live.find((b) => (b.status === "pending" || b.status === "confirmed") && b.endMin > now.minutes) : undefined;

  return (
    <div className="grid gap-8">
      {sp.welcome === "1" && (
        <section className="board p-5 sm:p-6">
          <h2 className="sign-sm text-[30px]">{t.welcome.title}</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-board-ink">{t.welcome.text}</p>
          <ol className="rows-board mt-5 border-y-2 border-white text-[15px] font-extrabold">
            {[
              { href: "/dashboard/services", label: t.welcome.s1 },
              { href: "/dashboard/hours", label: t.welcome.s2 },
              { href: null, label: t.welcome.s3 },
            ].map((st, i) => (
              <li key={st.label} className="flex items-center gap-3">
                <span className="num w-6 text-[26px] text-chalk">{i + 1}</span>
                {st.href ? (
                  <Link href={st.href} className="flex min-h-12 flex-1 items-center justify-between gap-3 py-2 hover:text-chalk">
                    {st.label}
                    <Icon name="arrow" className="size-[18px]" />
                  </Link>
                ) : (
                  <span className="flex min-h-12 flex-1 items-center py-2">{st.label}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="h-page">{formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" })}</h1>
            <p className="mt-2 text-[15px] text-muted">
              <b className="font-extrabold text-ink">{plural(locale, live.length, t.bookings.count)}</b>
              {revenue > 0 && <> · {fmt(t.bookings.revenue, { sum: money(revenue, locale, c.free) })}</>}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/dashboard?date=${addDays(date, -1)}`} className="btn btn-line btn-sm w-10 px-0" aria-label={t.bookings.prev}>
              <Icon name="chevronLeft" className="size-[18px]" />
            </Link>
            {date !== today && (
              <Link href="/dashboard" className="btn btn-line btn-sm">
                {t.bookings.today}
              </Link>
            )}
            <Link href={`/dashboard?date=${addDays(date, 1)}`} className="btn btn-line btn-sm w-10 px-0" aria-label={t.bookings.next}>
              <Icon name="chevronRight" className="size-[18px]" />
            </Link>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p className="card mt-5 px-5 py-10 text-center text-muted">{t.bookings.empty}</p>
        ) : (
          <div className="card rows mt-5 overflow-hidden">
            {bookings.map((b) => {
              const lang = isLocale(b.lang) ? b.lang : "tr";
              const wa = waLink(
                b.customerPhone,
                message("clientConfirmed", lang, {
                  service: serviceName(b.service, lang),
                  business: business.name,
                  date: formatDate(b.date, lang),
                  time: hhmm(b.startMin),
                  link: bookingLink(b.token),
                }),
              );
              const isActive = b.status === "pending" || b.status === "confirmed";
              const cancelled = b.status === "cancelled";
              const status = b.status as keyof typeof c.status;
              const isNext = nextUp?.id === b.id;
              return (
                <article key={b.id} className="grid grid-cols-[4.5rem_1fr] gap-x-3.5 p-3.5 sm:grid-cols-[5.25rem_1fr] sm:gap-x-5 sm:p-4">
                  <div
                    className={`grid h-[4.25rem] content-center justify-items-center self-start rounded-[12px] ${
                      isNext ? "bg-board text-white" : cancelled ? "bg-paper text-muted" : "bg-board-tint text-board"
                    }`}
                  >
                    <span className={`num text-[28px] ${isNext ? "text-chalk" : ""} ${cancelled ? "line-through" : ""}`}>{hhmm(b.startMin)}</span>
                    <span className={`mt-0.5 text-[13px] font-bold tabular-nums ${isNext ? "text-board-ink" : "text-muted"}`}>{hhmm(b.endMin)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-[17px] font-extrabold ${cancelled ? "text-muted" : ""}`}>{b.customerName}</span>
                      <span className={STATUS_CHIP[b.status] ?? "chip"}>{c.status[status] ?? b.status}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-muted">
                      <span>{serviceName(b.service, locale)}</span>
                      <span className="font-bold text-ink tabular-nums">{money(b.price, locale, c.free)}</span>
                      {b.staff && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ background: staffColor(staffIds, b.staffId) }} aria-hidden />
                          {b.staff.name}
                        </span>
                      )}
                      {b.source === "manual" && <span className="text-[13px]">{t.bookings.manual}</span>}
                    </div>
                    <a href={`tel:+${b.customerPhone}`} className="mt-1 inline-block font-bold text-board tabular-nums underline-offset-4 hover:underline">
                      +{b.customerPhone}
                    </a>
                    {b.note && (
                      <p className="mt-2 rounded-[10px] bg-paper px-3 py-2 text-sm">
                        <span className="text-muted">{t.bookings.note}: </span>
                        {b.note}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                        <Icon name="chat" className="size-[18px]" />
                        {t.bookings.whatsapp}
                      </a>
                      {isActive && (
                        <>
                          <form action={setStatusAction.bind(null, b.id, "completed")}>
                            <SubmitButton className="btn btn-line btn-sm">
                              <Icon name="check" className="size-[18px]" />
                              {t.bookings.done}
                            </SubmitButton>
                          </form>
                          <form action={setStatusAction.bind(null, b.id, "no_show")}>
                            <SubmitButton className="btn btn-line btn-sm">{t.bookings.noShow}</SubmitButton>
                          </form>
                          <form action={setStatusAction.bind(null, b.id, "cancelled")}>
                            <ConfirmSubmit message={t.common.confirmCancel}>{t.bookings.cancel}</ConfirmSubmit>
                          </form>
                        </>
                      )}
                      {(b.status === "completed" || b.status === "no_show") && (
                        <form action={setStatusAction.bind(null, b.id, "confirmed")}>
                          <SubmitButton className="btn btn-line btn-sm">
                            <Icon name="undo" className="size-[18px]" />
                            {t.bookings.restore}
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <details className="card group">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-[18px] p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-board text-white">
            <Icon name="plus" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-extrabold">{t.manual.title}</span>
            <span className="block text-sm text-muted">{t.manual.hint}</span>
          </span>
          <Icon name="chevronDown" className="size-5 text-muted transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-line p-4 sm:p-5">
          {services.length === 0 ? (
            <p className="text-[15px] text-muted">
              <Link href="/dashboard/services" className="font-extrabold text-board underline decoration-2">
                {t.manual.noServices}
              </Link>
            </p>
          ) : (
            <ManualBookingForm
              key={date}
              action={addManualBookingAction}
              services={services.map((s) => ({ id: s.id, name: serviceName(s, locale), durationMin: s.durationMin }))}
              staff={activeStaff.map((s) => ({ id: s.id, name: s.name }))}
              hours={hours}
              slotStep={business.slotStep}
              defaultDate={date}
              t={{
                service: t.manual.service,
                staff: t.manual.staff,
                any: t.bookings.anyStaff,
                date: t.manual.date,
                time: t.manual.time,
                closed: t.manual.closed,
                name: t.manual.name,
                phone: t.manual.phone,
                note: t.manual.note,
                submit: t.manual.submit,
                min: t.common.min,
              }}
            />
          )}
        </div>
      </details>

      <section className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t-2 border-ink pt-4">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <div className="text-[13px] font-bold text-muted">{t.bookings.yourLink}</div>
          <a href={link} target="_blank" rel="noopener" className="block truncate text-[17px] font-extrabold text-board">
            {link.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex gap-2">
          <CopyButton text={link} label={t.common.copy} doneLabel={t.common.copied} />
          <a href={link} target="_blank" rel="noopener" className="btn btn-line btn-sm">
            {t.common.open}
          </a>
        </div>
      </section>
    </div>
  );
}
