"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/locales";

/** Three painted letters; the current language carries the chalk underline. */
export function LangSwitch({ locale }: { locale: Locale }) {
  const path = usePathname();
  const search = useSearchParams().toString();
  const next = encodeURIComponent(path + (search ? `?${search}` : ""));
  return (
    <div className="flex" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <a
          key={l}
          href={`/api/lang?l=${l}&next=${next}`}
          aria-current={l === locale ? "true" : undefined}
          className={`relative grid h-11 min-w-10 place-items-center px-1.5 text-[13px] font-extrabold tracking-[0.06em] transition ${
            l === locale
              ? "text-white after:absolute after:inset-x-2 after:bottom-1.5 after:h-[3px] after:rounded-full after:bg-chalk"
              : "text-board-ink hover:text-white"
          }`}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
