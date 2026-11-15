import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ShareButton } from "@/components/ShareButton";
import { Stars } from "@/components/ui";
import { Icon } from "@/components/icons";
import { businessLink, canBookOnline, loadBookingBusiness } from "@/lib/booking";
import { categoryName, cityName, money, serviceName, waLink, CITIES } from "@/lib/catalog";
import { isOpenDay } from "@/lib/availability";
import { openState, soonestByService } from "@/lib/listing";
import { addDays, formatDate, hhmm, nowLocal } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";
import { fmt } from "@/i18n/locales";
import { BookingWidget } from "./BookingWidget";

type Params = Promise<{ slug: string }>;
type SP = Promise<{ s?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const b = await loadBookingBusiness({ slug });
  if (!b) return {};
  return { title: b.name, description: `${b.name} · ${b.area ? `${b.area}, ` : ""}${cityName(b.city, "en")} — online booking` };
}

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const SUNDAY = "2024-01-07";

export default async function BusinessPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const b = await loadBookingBusiness({ slug });
  if (!b) notFound();
  const wanted = (await searchParams).s;
  const locale = await getLocale();
  const t = publicDict[locale];
  const c = common[locale];
  const now = nowLocal();
  const enabled = canBookOnline(b);
  const state = openState(b.hours, now);
  const cityTr = CITIES.find((x) => x[0] === b.city)?.[1] ?? "";
  const mapsQuery = encodeURIComponent([b.address || b.area, cityTr, "KKTC"].filter(Boolean).join(", "));

  const horizon = Math.min(b.maxDaysAhead, 30);
  const days = Array.from({ length: horizon + 1 }, (_, i) => {
    const date = addDays(now.date, i);
    return {
      date,
      wd: formatDate(date, locale, { weekday: "short" }),
      day: Number(date.slice(8)),
      open: isOpenDay(b, date),
      long: formatDate(date, locale, { weekday: "short", day: "numeric", month: "long" }),
    };
  });

  const tomorrow = addDays(now.date, 1);
  const soonRaw = enabled ? await soonestByService(b) : {};
  const soonest = Object.fromEntries(
    Object.entries(soonRaw).map(([id, v]) => [
      id,
      {
        ...v,
        time: hhmm(v.start),
        label: v.date === now.date ? t.today : v.date === tomorrow ? t.tomorrow : formatDate(v.date, locale, { weekday: "short", day: "numeric" }),
      },
    ]),
  );

  const todayWd = new Date(`${now.date}T12:00:00Z`).getUTCDay();
  const action = "btn btn-onboard btn-sm h-11 gap-1.5 px-2 text-[13px]";

  return (
    <>
      <div className="bg-board text-white">
        <SiteHeader />
        <div className="container-app pt-4 pb-7 sm:pt-8">
          <h1 className="sign text-[clamp(3rem,15vw,5.5rem)] text-balance [overflow-wrap:anywhere]">{b.name}</h1>
          <p className="mt-3 text-[17px] font-semibold text-board-ink">
            {categoryName(b.category, locale)} · {b.area ? `${b.area}, ` : ""}
            {cityName(b.city, locale)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px] font-extrabold">
            {state.open ? (
              <span className="inline-flex items-center gap-2 text-chalk">
                <span className="size-2 rounded-full bg-chalk" aria-hidden />
                {fmt(t.openUntil, { t: hhmm(state.until) })}
              </span>
            ) : (
              <span className="text-board-ink">{t.closedNow}</span>
            )}
            <Stars rating={b.rating} count={b.ratingCount} onBoard />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
            <a className={action} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}>
              <Icon name="pin" className="size-[18px]" />
              {t.route}
            </a>
            <a className={action} target="_blank" rel="noopener noreferrer" href={waLink(b.phone)}>
              <Icon name="chat" className="size-[18px]" />
              {t.whatsapp}
            </a>
            <ShareButton url={businessLink(b.slug)} title={b.name} label={t.share} copiedLabel={t.copied} className={action} />
          </div>
        </div>
        <div className="shore" aria-hidden />
      </div>

      <main className="container-app grid gap-10 pt-3 lg:grid-cols-[1fr_340px] lg:gap-12 lg:pt-4">
        <div className="min-w-0">
          {b.about && <p className="mb-8 max-w-[60ch] text-[17px] leading-relaxed whitespace-pre-line">{b.about}</p>}

          <h2 className="h-section mb-3">{t.services}</h2>
          {!enabled && <p className="mb-3 rounded-xl bg-chalk-tint px-4 py-3 text-[15px] font-bold text-ink">{t.unavailable}</p>}
          <BookingWidget
            businessId={b.id}
            businessName={b.name}
            locale={locale}
            enabled={enabled}
            services={b.services.map((s) => ({ id: s.id, name: serviceName(s, locale), durationMin: s.durationMin, priceLabel: money(s.price, locale, c.free) }))}
            staff={b.staff.map((s) => ({ id: s.id, name: s.name }))}
            days={days}
            soonest={soonest}
            initialServiceId={wanted}
            cols={[t.b.soonest, t.done.service, t.done.price]}
            t={t.b}
            bookLabel={t.book}
            minLabel={c.min}
          />
        </div>

        <aside className="grid content-start gap-3">
          <h2 className="h-section mb-0">{t.hours}</h2>
          <dl className="card overflow-hidden text-[15px]">
            {WEEK.map((wd) => {
              const iv = b.hours.filter((h) => h.weekday === wd).sort((x, y) => x.openMin - y.openMin);
              const isToday = wd === todayWd;
              return (
                <div key={wd} className={`flex justify-between gap-3 border-b border-line px-4 py-2.5 last:border-b-0 ${isToday ? "bg-chalk-tint font-extrabold" : ""}`}>
                  <dt className="capitalize">{formatDate(addDays(SUNDAY, wd), locale, { weekday: "long" })}</dt>
                  <dd className={iv.length ? "tabular-nums" : "text-muted"}>
                    {iv.length ? iv.map((h) => `${hhmm(h.openMin)}–${hhmm(h.closeMin)}`).join(", ") : t.dayOff}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="mt-2 grid gap-1.5 text-[15px]">
            {(b.address || b.area) && (
              <p className="flex gap-2">
                <Icon name="pin" className="mt-0.5 size-[18px] text-board" />
                <span>{[b.address, b.area, cityName(b.city, locale)].filter(Boolean).join(", ")}</span>
              </p>
            )}
            <p className="text-muted">
              {t.languages}: <b className="font-extrabold text-ink">{b.languages.split(",").join(" · ")}</b>
            </p>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
