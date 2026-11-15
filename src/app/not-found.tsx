import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getLocale } from "@/i18n/server";
import { publicDict } from "@/i18n/public";
import { common } from "@/i18n/common";

export default async function NotFound() {
  const locale = await getLocale();
  const t = publicDict[locale];
  return (
    <div className="flex min-h-dvh flex-col bg-board text-white">
      <SiteHeader />
      <main className="container-app flex-1 py-16 sm:py-24">
        <p className="num text-[clamp(7rem,40vw,13rem)] leading-[0.8] text-chalk">404</p>
        <h1 className="sign mt-6 max-w-[12ch] text-[52px] text-balance sm:text-[72px]">{t.nothing}</h1>
        <Link href="/" className="btn btn-chalk mt-8">
          {common[locale].nav.home}
        </Link>
      </main>
    </div>
  );
}
