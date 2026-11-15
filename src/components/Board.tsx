import Link from "next/link";
import type { CSSProperties } from "react";
import type { BoardRow } from "@/lib/listing";
import { cityName, money, serviceName } from "@/lib/catalog";
import { formatDate, hhmm, addDays } from "@/lib/time";
import type { Locale } from "@/i18n/locales";
import type { PublicDict } from "@/i18n/public";
import { Icon } from "./icons";

/** The board of soonest free times: yellow time, service and place, price. Every row is a real slot. */
export function Board({
  rows,
  today,
  locale,
  t,
  freeLabel,
  className = "",
}: {
  rows: BoardRow[];
  today: string;
  locale: Locale;
  t: PublicDict;
  freeLabel: string;
  className?: string;
}) {
  const dayLabel = (date: string) =>
    date === today ? null : date === addDays(today, 1) ? t.tomorrow : formatDate(date, locale, { weekday: "short", day: "numeric" });

  return (
    <section className={`board overflow-hidden ${className}`} aria-labelledby="board-title">
      <div className="flex items-end justify-between gap-4 px-4 pt-4 pb-3.5 sm:px-5">
        <h2 id="board-title" className="sign max-w-[14ch] text-[30px] text-balance">
          {t.boardTitle}
        </h2>
        <span className="shrink-0 pb-0.5 text-right text-[13px] leading-tight font-bold text-board-ink">
          {t.today},<br />
          {formatDate(today, locale, { weekday: "short", day: "numeric", month: "long" })}
        </span>
      </div>

      {rows.length > 0 ? (
        <>
          <ol className="rows-board border-t-2 border-white">
            {rows.map((r, i) => {
              const day = dayLabel(r.date);
              return (
                <li key={r.slug} className="row-in" style={{ "--i": i } as CSSProperties}>
                  <Link
                    href={`/b/${r.slug}?s=${r.serviceId}`}
                    className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2.5 px-4 py-3 transition duration-150 hover:bg-board-deep sm:px-5"
                  >
                    <span>
                      <span className="num block text-[46px] text-chalk">{hhmm(r.start)}</span>
                      {day && <span className="mt-0.5 block text-[12.5px] leading-none font-bold text-board-ink">{day}</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[16px] leading-[1.15] font-extrabold">{serviceName(r.service, locale)}</span>
                      <span className="mt-0.5 block truncate text-[13.5px] text-board-ink">
                        {r.business} · {r.area || cityName(r.city, locale)}
                      </span>
                    </span>
                    <span className="num text-[26px]">{money(r.price, locale, freeLabel)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link
            href="/search"
            className="flex h-14 items-center justify-between border-t-2 border-white px-4 text-[15px] font-extrabold transition duration-150 hover:bg-board-deep sm:px-5"
          >
            {t.allPlaces}
            <Icon name="arrow" />
          </Link>
        </>
      ) : (
        <div className="border-t-2 border-white px-4 py-8 sm:px-5">
          <p className="sign max-w-[14ch] text-[38px] text-balance text-chalk">{t.emptyTitle}</p>
          <p className="mt-3 max-w-[38ch] text-board-ink">{t.emptyText}</p>
          <Link href="/biz" className="btn btn-chalk mt-6">
            {t.promoCta}
            <Icon name="arrow" className="size-[18px]" />
          </Link>
        </div>
      )}
    </section>
  );
}
