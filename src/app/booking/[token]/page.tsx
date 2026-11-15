import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ShareButton } from "@/components/ShareButton";
import { Mono } from "@/components/ui";
import { Icon } from "@/components/icons";
import { bookingLink, canClientCancel, getBookingByToken } from "@/lib/booking";
import { categoryName, cityName, money, serviceName, waLink } from "@/lib/catalog";
import { formatDate, hhmm } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";
import { CancelForm } from "./CancelForm";

export const metadata: Metadata = { title: "Booking", robots: { index: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> };

export default async function BookingPage({ params, searchParams }: Props) {
  const { token } = await params;
  const isNew = (await searchParams).new === "1";
  const bk = await getBookingByToken(token);
  if (!bk) notFound();
  const locale = await getLocale();
  const t = publicDict[locale];
  const c = common[locale];
  const b = bk.business;
  const active = bk.status === "pending" || bk.status === "confirmed";
  const cancellable = canClientCancel(bk, b.cancelHours);
  const dateLong = formatDate(bk.date, locale, { weekday: "long", day: "numeric", month: "long" });
  const tone = bk.status === "confirmed" ? "text-ok" : bk.status === "pending" ? "text-board" : bk.status === "cancelled" ? "text-danger" : "text-muted";

  const title =
    bk.status === "cancelled" ? t.done.cancelled : bk.status === "pending" ? t.done.titlePending : active ? t.done.title : c.status[bk.status as keyof typeof c.status];

  return (
    <>
      <div className="bg-board text-white">
        <SiteHeader />
        <div className="container-app max-w-xl pt-4 pb-7 sm:pt-8">
          <h1 className="sign text-[clamp(2.75rem,13vw,4.5rem)] text-balance">{title}</h1>
          {active && <p className="mt-3 max-w-[38ch] text-[17px] text-board-ink">{t.done.text}</p>}
        </div>
        <div className="shore" aria-hidden />
      </div>

      <main className="container-app max-w-xl">
        <section className="panel overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
            <div className="min-w-0">
              <p className={`num text-[64px] leading-[0.9] ${active ? "text-board" : "text-muted line-through decoration-2"}`}>{hhmm(bk.startMin)}</p>
              <p className="mt-2 text-[17px] leading-snug font-extrabold first-letter:uppercase">{dateLong}</p>
              <p className="text-[15px] text-muted tabular-nums">
                {hhmm(bk.startMin)}–{hhmm(bk.endMin)}
              </p>
            </div>
            <span className={`stamp-mark mt-2 shrink-0 ${tone} ${isNew && active ? "animate-[pop_.5s_var(--ease-out-expo)_.15s_both]" : ""}`}>
              {c.status[bk.status as keyof typeof c.status] ?? bk.status}
            </span>
          </div>

          <dl className="rows border-t border-line px-5 text-[15px]">
            {[
              [t.done.service, serviceName(bk.service, locale)],
              ...(bk.staff ? [[t.done.staff, bk.staff.name]] : []),
              [t.done.price, money(bk.price, locale, c.free)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>

          <Link href={`/b/${b.slug}`} className="flex items-center gap-3 border-t border-line px-5 py-3.5 transition duration-150 hover:bg-board-tint/50">
            <Mono name={b.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold">{b.name}</div>
              <div className="truncate text-[13px] text-muted">
                {categoryName(b.category, locale)} · {[b.address || b.area, cityName(b.city, locale)].filter(Boolean).join(", ")}
              </div>
            </div>
            <Icon name="chevronRight" className="size-4 text-rule" />
          </Link>
        </section>

        <div className="mt-5 grid gap-2">
          {active && (
            <a href={`/booking/${bk.token}/ics`} className="btn btn-primary w-full">
              <Icon name="calendar" />
              {t.done.addCal}
            </a>
          )}
          {!active && (
            <Link href={`/b/${b.slug}`} className="btn btn-primary w-full">
              {t.done.again}
            </Link>
          )}
          <a href={waLink(b.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-line w-full">
            <Icon name="chat" />
            {t.done.writeBusiness}
          </a>
          <ShareButton url={bookingLink(bk.token)} title={b.name} label={t.done.copyLink} copiedLabel={t.copied} className="btn btn-line w-full" />
          {active &&
            (cancellable ? (
              <CancelForm token={bk.token} label={t.done.cancel} question={t.done.cancelQ} tooLate={t.done.tooLate} />
            ) : (
              <p className="rounded-xl bg-chalk-tint px-3.5 py-2.5 text-center text-sm font-bold text-ink">{t.done.tooLate}</p>
            ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
