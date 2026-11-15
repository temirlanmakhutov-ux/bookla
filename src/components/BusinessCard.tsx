import Link from "next/link";
import type { ListingCard } from "@/lib/listing";
import { categoryName, cityName, money } from "@/lib/catalog";
import { hhmm } from "@/lib/time";
import { fmt, type Locale } from "@/i18n/locales";
import type { PublicDict } from "@/i18n/public";
import { Mono, Stars } from "./ui";

/** One place as a line of the price list: plate, name, where, whether it is open, and the lowest price. */
export function BusinessCard({ b, locale, t, freeLabel }: { b: ListingCard; locale: Locale; t: PublicDict; freeLabel: string }) {
  return (
    <Link
      href={`/b/${b.slug}`}
      className="card group flex min-w-0 items-center gap-3.5 p-3.5 transition duration-150 hover:border-board hover:shadow-[var(--shadow-panel)] active:scale-[0.99]"
    >
      <Mono name={b.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] leading-tight font-extrabold">{b.name}</div>
        <div className="mt-0.5 truncate text-[13.5px] text-muted">
          {categoryName(b.category, locale)} · {b.area ? `${b.area}, ` : ""}
          {cityName(b.city, locale)}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          {b.openUntil != null ? (
            <span className="inline-flex items-center gap-1.5 font-bold text-ok-ink">
              <span className="size-2 rounded-full bg-ok" aria-hidden />
              {fmt(t.openUntil, { t: hhmm(b.openUntil) })}
            </span>
          ) : (
            <span className="text-muted">{t.closedNow}</span>
          )}
          <Stars rating={b.rating} count={b.ratingCount} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        {b.minPrice ? (
          <div className="num text-[24px] text-ink">{fmt(t.fromPrice, { p: money(b.minPrice, locale, freeLabel) })}</div>
        ) : (
          <div className="sign-sm text-[17px] text-ok-ink">{freeLabel}</div>
        )}
      </div>
    </Link>
  );
}
