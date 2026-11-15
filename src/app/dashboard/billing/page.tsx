import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { waLink } from "@/lib/catalog";
import { PAID_PLANS, PLANS, daysLeft, subscriptionState } from "@/lib/plans";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { fmt } from "@/i18n/locales";
import { Icon } from "@/components/icons";
import { formatDay } from "../_lib";

export const metadata: Metadata = { title: "Subscription" };

export default async function BillingPage() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale].billing;
  const sub = subscriptionState(business);
  const support = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
  const planLabel = { solo: t.solo, salon: t.salon } as const;
  const planText = { solo: t.soloT, salon: t.salonT } as const;
  const tone = sub.kind === "expired" ? "bg-danger-tint text-danger" : sub.kind === "trial" ? "bg-chalk-tint text-ink" : "bg-ok-tint text-ok-ink";

  return (
    <div className="grid max-w-3xl gap-8">
      <h1 className="h-page">{t.title}</h1>

      <section className={`rounded-[18px] p-5 sm:p-6 ${tone}`}>
        <p className="num text-[44px] first-letter:uppercase sm:text-[52px]">
          {sub.kind === "expired" ? t.expired : fmt(t.daysLeft, { n: daysLeft(sub.until) })}
        </p>
        <p className="mt-2 text-[15px] font-bold">
          {sub.kind === "trial" ? t.trial : sub.kind === "paid" ? `${t.paid} · ${planLabel[business.plan as "solo" | "salon"] ?? business.plan}` : formatDay(sub.until, locale)}
        </p>
        <p className="mt-0.5 text-[15px]">{sub.kind === "expired" ? t.expiredText : fmt(t.until, { date: formatDay(sub.until, locale) })}</p>
      </section>

      <section>
        <h2 className="h-section">{t.plans}</h2>
        <div className="card rows mt-4">
          {PAID_PLANS.map((id) => {
            const current = sub.kind === "paid" && business.plan === id;
            return (
              <div key={id} className="grid gap-x-5 gap-y-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="sign-sm text-[26px]">{planLabel[id]}</b>
                    {current && <span className="chip chip-ok">{t.current}</span>}
                  </div>
                  <p className="mt-1 text-[15px] text-muted">{planText[id]}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="whitespace-nowrap">
                    <span className="num text-[40px] text-board">{PLANS[id].priceTl}</span> <span className="text-sm font-bold text-muted">{t.perMonth}</span>
                  </p>
                  {support && (
                    <a
                      href={waLink(support, fmt(t.waText, { plan: planLabel[id], slug: business.slug }))}
                      target="_blank"
                      rel="noopener"
                      className={`btn btn-sm ${id === "salon" ? "btn-primary" : "btn-ghost"}`}
                    >
                      <Icon name="chat" className="size-[18px]" />
                      {t.writeUs}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">{t.included}</p>
      </section>

      <section className="border-t-2 border-ink pt-4">
        <h2 className="h-section">{t.howTitle}</h2>
        <p className="mt-2 max-w-[65ch] text-[15px] text-muted">{t.howText}</p>
        <p className="mt-3 text-[15px] font-extrabold text-board">{t.freeForClients}</p>
      </section>
    </div>
  );
}
