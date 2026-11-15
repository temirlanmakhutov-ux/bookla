import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/icons";
import { BASE_URL } from "@/lib/booking";
import { PLANS } from "@/lib/plans";
import { money } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";
import { fmt } from "@/i18n/locales";

export const metadata: Metadata = { title: "For business" };

// Illustration of a business page: times, durations and prices of a made-up place.
const SAMPLE = [
  { time: "10:30", min: 45, price: 600 },
  { time: "11:00", min: 60, price: 450 },
  { time: "13:30", min: 60, price: 1200 },
];

export default async function BizLanding() {
  const locale = await getLocale();
  const p = publicDict[locale];
  const t = p.biz;
  const c = common[locale];
  const host = BASE_URL.replace(/^https?:\/\//, "");
  const features: [string, string][] = [
    [t.f1, fmt(t.f1t, { host })],
    [t.f2, t.f2t],
    [t.f3, t.f3t],
    [t.f4, t.f4t],
  ];
  const plans: [string, string, number][] = [
    [t.solo, t.soloT, PLANS.solo.priceTl],
    [t.salon, t.salonT, PLANS.salon.priceTl],
  ];

  return (
    <>
      <div className="bg-board text-white">
        <SiteHeader />
        <div className="container-app grid gap-10 pt-5 pb-9 sm:pt-10 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-14 lg:pb-14">
          <div>
            <h1 className="sign max-w-[11ch] text-[clamp(3.25rem,15.5vw,6rem)] text-balance">{t.title}</h1>
            <p className="mt-5 max-w-[44ch] text-[18px] leading-relaxed text-board-ink">{t.sub}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/biz/signup" className="btn btn-chalk btn-lg">
                {t.cta}
                <Icon name="arrow" />
              </Link>
              <span className="text-[15px] font-bold text-board-ink">{t.pricingSub}</span>
            </div>
          </div>

          <figure className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-board-tint/60 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[14px] font-extrabold text-board">
                {host}/b/{t.exSlug}
              </span>
              <span className="chip chip-chalk shrink-0">{p.example}</span>
            </div>
            <ul className="rows">
              {SAMPLE.map((row, i) => (
                <li key={row.time} className="grid grid-cols-[4.75rem_1fr_auto] items-center gap-3 px-3.5 py-3">
                  <span className="grid h-[54px] content-center justify-items-center gap-1 rounded-[10px] bg-board">
                    <span className="num text-[25px] leading-none text-chalk">{row.time}</span>
                    <span className="text-[11px] leading-none font-bold text-board-ink">{p.today}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] leading-snug font-extrabold">{t.ex[i]}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {row.min} {c.min}
                    </span>
                  </span>
                  <span className="num text-[22px] whitespace-nowrap">{money(row.price, locale, c.free)}</span>
                </li>
              ))}
            </ul>
            <figcaption className="border-t border-line px-4 py-3 text-[14px] text-muted">{t.exCaption}</figcaption>
          </figure>
        </div>
        <div className="shore" aria-hidden />
      </div>

      <main className="container-app pt-6 sm:pt-10">
        <dl className="grid gap-x-12 sm:grid-cols-2">
          {features.map(([h, text]) => (
            <div key={h} className="border-t-2 border-ink py-5">
              <dt className="sign-sm text-[26px] text-balance">{h}</dt>
              <dd className="mt-2 max-w-[44ch] text-[16px] text-muted [overflow-wrap:anywhere]">{text}</dd>
            </div>
          ))}
        </dl>

        <section className="board mt-14 px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h2 className="sign text-[44px] sm:text-[56px]">{t.pricing}</h2>
            <p className="pb-1 text-[17px] font-extrabold text-chalk">{t.trial}</p>
          </div>
          <ul className="rows-board mt-5 border-y-2 border-white">
            {plans.map(([name, desc, price]) => (
              <li key={name} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4">
                <div className="min-w-0">
                  <h3 className="sign-sm text-[26px]">{name}</h3>
                  <p className="mt-1 text-[15px] text-board-ink">{desc}</p>
                </div>
                <p className="text-right">
                  <span className="num block text-[44px] leading-none text-chalk">{money(price, locale, c.free)}</span>
                  <span className="text-[13px] font-bold text-board-ink">{t.perMonth}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/biz/signup" className="btn btn-chalk btn-lg w-full sm:w-auto">
              {t.cta}
              <Icon name="arrow" />
            </Link>
            <p className="max-w-[40ch] text-[15px] text-board-ink">{t.pricingSub}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
