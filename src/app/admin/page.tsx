import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { categoryName, cityName } from "@/lib/catalog";
import { subscriptionState } from "@/lib/plans";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo, Mono } from "@/components/ui";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/dashboard/forms";
import { logoutAction } from "@/app/biz/actions";
import { extendPlanAction, togglePublishedAction } from "./actions";
import { daysAgo, formatDay } from "@/app/dashboard/_lib";

export const metadata: Metadata = { title: "Admin" };

const NOTIF_CHIP: Record<string, string> = { sent: "chip chip-ok", failed: "chip chip-danger", skipped: "chip chip-gray", queued: "chip chip-chalk" };

export default async function AdminPage() {
  const owner = await requireAdmin();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const a = t.admin;
  const since = daysAgo(30);

  const [businesses, counts, notifications] = await Promise.all([
    prisma.business.findMany({ orderBy: [{ createdAt: "desc" }] }),
    prisma.booking.groupBy({ by: ["businessId"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { business: { select: { name: true } } } }),
  ]);
  const countOf = new Map(counts.map((c) => [c.businessId, c._count._all]));
  const fmtTime = (d: Date) =>
    d.toLocaleString(locale === "ru" ? "ru-RU" : locale === "en" ? "en-GB" : "tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Famagusta",
    });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-board text-white">
        <div className="container-app flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="chip chip-chalk">{a.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {owner.business && (
              <Link href="/dashboard" className="btn btn-onboard btn-sm mr-1 hidden sm:inline-flex">
                {a.toDashboard}
              </Link>
            )}
            <Suspense fallback={<div className="h-11 w-[120px]" />}>
              <LangSwitch locale={locale} />
            </Suspense>
            <form action={logoutAction}>
              <button
                className="grid size-11 place-items-center rounded-xl text-board-ink transition hover:bg-white/10 hover:text-white"
                aria-label={t.nav.logout}
                title={t.nav.logout}
              >
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-app grid grid-cols-1 gap-10 py-7 sm:py-10">
        <section>
          <h1 className="h-page">
            {a.businesses} <span className="text-board tabular-nums">{businesses.length}</span>
          </h1>
          <div className="card rows mt-5">
            {businesses.map((b) => {
              const sub = subscriptionState(b);
              const statusChip =
                sub.kind === "paid" ? "chip chip-ok" : sub.kind === "trial" ? "chip chip-chalk" : "chip chip-danger";
              const statusLabel = sub.kind === "paid" ? a.paid : sub.kind === "trial" ? a.trial : a.expired;
              return (
                <article key={b.id} className="p-4 sm:px-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <Mono name={b.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/b/${b.slug}`} className="text-[17px] font-extrabold underline-offset-4 hover:text-board hover:underline" target="_blank">
                          {b.name}
                        </Link>
                        <span className={statusChip}>{statusLabel}</span>
                        {!b.published && <span className="chip chip-gray">{a.hidden}</span>}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">
                        {categoryName(b.category, locale)} · {cityName(b.city, locale)} · /b/{b.slug}
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-4">
                        <div>
                          <dt className="text-muted">{a.plan}</dt>
                          <dd className="font-bold">{b.plan}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">{a.trialUntil}</dt>
                          <dd className="font-bold">{formatDay(b.trialEndsAt, locale)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">{a.paidUntil}</dt>
                          <dd className="font-bold">{b.paidUntil ? formatDay(b.paidUntil, locale) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">{a.bookings30}</dt>
                          <dd className="font-bold tabular-nums">{countOf.get(b.id) ?? 0}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:flex-col">
                      <form action={extendPlanAction.bind(null, b.id, "solo")}>
                        <SubmitButton className="btn btn-ghost btn-sm w-full">{a.addSolo}</SubmitButton>
                      </form>
                      <form action={extendPlanAction.bind(null, b.id, "salon")}>
                        <SubmitButton className="btn btn-primary btn-sm w-full">{a.addSalon}</SubmitButton>
                      </form>
                      <form action={togglePublishedAction.bind(null, b.id)}>
                        <SubmitButton className="btn btn-line btn-sm w-full">{b.published ? a.hide : a.show}</SubmitButton>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="h-section">{a.outbox}</h2>
          {notifications.length === 0 ? (
            <p className="card mt-4 px-5 py-10 text-center text-muted">{a.empty}</p>
          ) : (
            <div className="card rows mt-4">
              {notifications.map((n) => (
                <article key={n.id} className="p-4 text-sm sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={NOTIF_CHIP[n.status] ?? "chip"}>{n.status}</span>
                    <span className="font-extrabold">{n.kind}</span>
                    <span className="text-muted tabular-nums">+{n.to}</span>
                    <span className="text-muted">· {n.business.name}</span>
                    <span className="ml-auto text-[13px] text-muted tabular-nums">{fmtTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-2 max-w-[75ch] whitespace-pre-line break-words">{n.body}</p>
                  {n.error && <p className="mt-1.5 text-[13px] font-bold text-danger">{n.error}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
