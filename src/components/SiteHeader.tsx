import Link from "next/link";
import { Suspense } from "react";
import { getLocale } from "@/i18n/server";
import { common } from "@/i18n/common";
import { getOwner } from "@/lib/auth";
import { LangSwitch } from "./LangSwitch";
import { Logo } from "./ui";
import { Icon } from "./icons";

/** The top of the board: wordmark, languages, owner entrance. Cobalt on every public page. */
export async function SiteHeader() {
  const locale = await getLocale();
  const t = common[locale];
  const owner = await getOwner();
  return (
    <header className="bg-board text-white">
      <div className="container-app flex h-16 items-center justify-between gap-2">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/biz" className="hidden px-2 text-sm font-bold text-board-ink transition hover:text-white sm:inline">
            {t.nav.forBusiness}
          </Link>
          <Suspense fallback={<div className="h-11 w-[120px]" />}>
            <LangSwitch locale={locale} />
          </Suspense>
          <Link href={owner ? "/dashboard" : "/biz/login"} className="btn btn-onboard btn-sm ml-1">
            {owner ? t.nav.dashboard : t.nav.login}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const locale = await getLocale();
  return (
    <footer className="mt-20 bg-ink text-board-ink">
      <div className="container-app flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-8 text-sm">
        <span>{common[locale].footer}</span>
        <Link href="/biz" className="inline-flex items-center gap-1.5 font-extrabold text-white hover:text-chalk">
          {common[locale].nav.forBusiness}
          <Icon name="arrow" className="size-4" />
        </Link>
      </div>
    </footer>
  );
}
