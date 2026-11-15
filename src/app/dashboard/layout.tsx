import Link from "next/link";
import { Suspense } from "react";
import { requireBusiness, isAdmin } from "@/lib/auth";
import { daysLeft, subscriptionState } from "@/lib/plans";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { fmt } from "@/i18n/locales";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/icons";
import { DashNav } from "@/components/dashboard/DashNav";
import { logoutAction } from "@/app/biz/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { owner, business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const sub = subscriptionState(business);

  const items = [
    { href: "/dashboard", label: t.nav.bookings },
    { href: "/dashboard/services", label: t.nav.services },
    { href: "/dashboard/staff", label: t.nav.staff },
    { href: "/dashboard/hours", label: t.nav.hours },
    { href: "/dashboard/profile", label: t.nav.profile },
    { href: "/dashboard/billing", label: t.nav.billing },
  ];
  if (isAdmin(owner.email)) items.push({ href: "/admin", label: t.nav.admin });

  return (
    <div className="min-h-dvh">
      <header className="bg-board text-white">
        <div className="container-app flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-3">
            <Logo />
            <span className="hidden truncate text-sm font-bold text-board-ink sm:inline">{business.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/b/${business.slug}`} className="btn btn-onboard btn-sm mr-1 hidden sm:inline-flex">
              {t.nav.viewPage}
            </Link>
            <Suspense fallback={<div className="h-11 w-[120px]" />}>
              <LangSwitch locale={locale} />
            </Suspense>
            <form action={logoutAction}>
              <button
                className="grid size-11 place-items-center rounded-xl text-board-ink transition hover:bg-white/10 hover:text-white"
                title={t.nav.logout}
                aria-label={t.nav.logout}
              >
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="sticky top-0 z-30 bg-board text-white shadow-[0_10px_24px_-18px_rgb(7_26_68/0.7)]">
        <div className="container-app border-t border-white/20">
          <DashNav items={items} label={business.name} />
        </div>
      </div>

      {sub.kind === "trial" && (
        <div className="bg-chalk-tint text-ink">
          <div className="container-app flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
            <span className="font-bold">{fmt(t.banner.trial, { n: daysLeft(sub.until) })}</span>
            <Link href="/dashboard/billing" className="font-extrabold underline decoration-2">
              {t.banner.choose}
            </Link>
          </div>
        </div>
      )}
      {sub.kind === "expired" && (
        <div className="bg-danger-tint">
          <div className="container-app flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-sm">
            <span className="font-extrabold text-danger">{t.banner.expired}</span>
            <Link href="/dashboard/billing" className="btn btn-stamp btn-sm">
              {t.banner.renew}
            </Link>
          </div>
        </div>
      )}

      <main className="container-app py-7 sm:py-10">{children}</main>
    </div>
  );
}
