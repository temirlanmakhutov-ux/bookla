import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { SearchForm } from "@/components/SearchForm";
import { BusinessCard } from "@/components/BusinessCard";
import { CATEGORIES, categoryName, isCategory, isCity } from "@/lib/catalog";
import { listBusinesses } from "@/lib/listing";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";
import { plural } from "@/i18n/locales";

export const metadata: Metadata = { title: "Search" };

type SP = Promise<{ q?: string; cat?: string; city?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = publicDict[locale];
  const c = common[locale];
  const cat = isCategory(sp.cat) ? sp.cat : undefined;
  const city = isCity(sp.city) ? sp.city : undefined;
  const q = (sp.q ?? "").slice(0, 80);
  const results = await listBusinesses({ cat, city, q });

  const href = (nextCat?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (city) p.set("city", city);
    if (nextCat) p.set("cat", nextCat);
    const s = p.toString();
    return `/search${s ? `?${s}` : ""}`;
  };

  const pill = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-extrabold whitespace-nowrap transition duration-150 ${
      active ? "bg-chalk text-ink" : "border-[1.5px] border-white/70 text-white hover:border-white hover:bg-white hover:text-board"
    }`;

  return (
    <>
      <div className="bg-board text-white">
        <SiteHeader />
        <div className="container-app pt-4 pb-7 sm:pt-8">
          <div className="flex items-end justify-between gap-4">
            <h1 className="sign text-[clamp(2.75rem,13vw,4.5rem)] text-balance [overflow-wrap:anywhere]">
              {cat ? categoryName(cat, locale) : q ? `“${q}”` : t.allPlaces}
            </h1>
            <span className="num shrink-0 pb-1 text-[22px] text-chalk">{plural(locale, results.length, t.placesN)}</span>
          </div>
          <div className="mt-5">
            <SearchForm locale={locale} placeholder={t.searchPh} button={t.search} allCities={c.allCities} q={q} city={city} cat={cat} />
          </div>
          <nav className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={t.categories}>
            <Link href={href()} aria-current={!cat ? "page" : undefined} className={pill(!cat)}>
              {t.all}
            </Link>
            {CATEGORIES.map(([id]) => (
              <Link key={id} href={href(id)} aria-current={cat === id ? "page" : undefined} className={pill(cat === id)}>
                {categoryName(id, locale)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="shore" aria-hidden />
      </div>

      <main className="container-app pt-2 sm:pt-4">
        {results.length ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {results.map((b) => (
              <BusinessCard key={b.slug} b={b} locale={locale} t={t} freeLabel={c.free} />
            ))}
          </div>
        ) : (
          <div className="py-10 sm:py-16">
            <h2 className="sign max-w-[12ch] text-[52px] text-balance text-board sm:text-[72px]">{t.nothing}</h2>
            <p className="mt-4 max-w-[40ch] text-lg text-muted">{t.nothingText}</p>
            <Link href="/search" className="btn btn-primary mt-7">
              {t.allPlaces}
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
