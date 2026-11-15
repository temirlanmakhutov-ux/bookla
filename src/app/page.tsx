import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { SearchForm } from "@/components/SearchForm";
import { BusinessCard } from "@/components/BusinessCard";
import { Board } from "@/components/Board";
import { Icon } from "@/components/icons";
import { CATEGORIES, categoryName } from "@/lib/catalog";
import { categoryCounts, listBusinesses, soonestFree } from "@/lib/listing";
import { todayLocal } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";

export default async function Home() {
  const locale = await getLocale();
  const t = publicDict[locale];
  const c = common[locale];
  const [top, rows, counts] = await Promise.all([listBusinesses({ take: 8 }), soonestFree({ take: 5 }), categoryCounts()]);

  return (
    <>
      <div className="bg-board text-white">
        <SiteHeader />
        <section className="container-app pt-5 pb-12 sm:pt-12 sm:pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:items-start lg:gap-16">
          <div>
            <h1 className="sign text-[clamp(4rem,19.5vw,6rem)]">
              {t.heroA}
              <br />
              <span className="text-chalk">{t.heroB}</span>
            </h1>
            <p className="mt-4 max-w-[36ch] text-[17px] leading-snug font-medium text-board-ink sm:mt-6 sm:text-lg">{t.heroSub}</p>
            <div className="mt-6 sm:mt-8">
              <SearchForm locale={locale} placeholder={t.searchPh} button={t.search} allCities={c.allCities} narrow />
            </div>
          </div>
          <Board rows={rows} today={todayLocal()} locale={locale} t={t} freeLabel={c.free} className="mt-9 lg:mt-1" />
        </section>
        <div className="shore" aria-hidden />
      </div>

      <main>
        <section className="container-app pt-6 sm:pt-10">
          <h2 className="h-section">{t.whatTitle}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-5 border-t-2 border-ink sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
            {CATEGORIES.map(([id]) => (
              <li key={id} className="border-b border-line">
                <Link
                  href={`/search?cat=${id}`}
                  className="sign-sm flex min-h-12 items-center justify-between gap-2 py-2 text-[21px] transition duration-150 hover:text-board"
                >
                  <span className="[overflow-wrap:anywhere]">{categoryName(id, locale)}</span>
                  {counts[id] ? <span className="font-sans text-[13px] font-bold text-muted tabular-nums">{counts[id]}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {top.length > 0 && (
          <section className="container-app mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="h-section">{t.popular}</h2>
              <Link href="/search" className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-extrabold text-board hover:underline">
                {t.allPlaces}
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {top.map((b) => (
                <BusinessCard key={b.slug} b={b} locale={locale} t={t} freeLabel={c.free} />
              ))}
            </div>
          </section>
        )}

        <section className="container-app mt-16">
          <Link
            href="/biz"
            className="group block rounded-[22px] bg-board p-6 text-white transition duration-150 hover:bg-board-deep sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9"
          >
            <span className="block">
              <span className="sign block max-w-[14ch] text-[44px] text-balance sm:text-[56px]">{t.promoTitle}</span>
              <span className="mt-3 block max-w-[34ch] text-board-ink sm:text-lg">{t.promoText}</span>
            </span>
            <span className="btn btn-chalk mt-6 sm:mt-0 sm:shrink-0">
              {t.promoCta}
              <Icon name="arrow" className="size-[18px]" />
            </span>
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
