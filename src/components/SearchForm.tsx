import { CITIES, cityName } from "@/lib/catalog";
import type { Locale } from "@/i18n/locales";
import { Icon } from "./icons";

/** The white plaque on the board. Plain GET form: search works without JavaScript and every result has a shareable URL. */
export function SearchForm({
  locale,
  placeholder,
  button,
  allCities,
  q = "",
  city = "",
  cat,
  narrow = false,
}: {
  locale: Locale;
  placeholder: string;
  button: string;
  allCities: string;
  q?: string;
  city?: string;
  cat?: string;
  /** Set where the form sits in a narrow column on wide screens: the city picker drops under the search field. */
  narrow?: boolean;
}) {
  return (
    <form action="/search" className={`flex flex-col gap-2 sm:flex-row ${narrow ? "lg:flex-col" : ""}`}>
      {cat && <input type="hidden" name="cat" value={cat} />}
      <div className="flex min-w-0 flex-1 items-center rounded-[14px] bg-white p-1.5 text-ink shadow-[0_12px_28px_-16px_rgb(7_26_68/0.7)] focus-within:ring-[3px] focus-within:ring-chalk">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 pl-2.5">
          <Icon name="search" className="size-5 text-muted" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder={placeholder}
            aria-label={placeholder}
            enterKeyHint="search"
            className="h-11 w-full min-w-0 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:text-[#6f7c9c] focus-visible:shadow-none focus-visible:outline-none"
          />
        </label>
        <button className="btn btn-stamp h-11 rounded-[10px] px-4">{button}</button>
      </div>
      <select
        name="city"
        defaultValue={city}
        aria-label={allCities}
        className={`h-12 appearance-none rounded-[14px] border-2 border-white bg-board bg-[length:18px] bg-[position:right_12px_center] bg-no-repeat pr-10 pl-4 text-[15px] font-bold text-white sm:h-14 sm:w-56 ${narrow ? "lg:h-12 lg:w-full" : ""}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
        }}
      >
        <option value="">{allCities}</option>
        {CITIES.map((c) => (
          <option key={c[0]} value={c[0]}>
            {cityName(c[0], locale)}
          </option>
        ))}
      </select>
    </form>
  );
}
