import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getOwner } from "@/lib/auth";
import { CATEGORIES, CITIES, categoryName, cityName } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { common } from "@/i18n/common";
import { SignupForm } from "../AuthForms";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  const owner = await getOwner();
  if (owner?.business) redirect("/dashboard");
  const locale = await getLocale();
  const t = common[locale].auth;
  return (
    <>
      <SiteHeader />
      <main className="container-app grid justify-items-center py-8 sm:py-14">
        <div className="w-full max-w-lg">
          <h1 className="sign text-[44px] text-balance text-board sm:text-[56px]">{t.signupTitle}</h1>
          <p className="mt-2 mb-6 text-[17px] text-muted">{t.signupSub}</p>
          <div className="panel p-5 sm:p-7">
          <SignupForm
            t={t}
            categories={CATEGORIES.map((c) => ({ id: c[0], label: categoryName(c[0], locale) }))}
            cities={CITIES.map((c) => ({ id: c[0], label: cityName(c[0], locale) }))}
          />
          </div>
        </div>
      </main>
    </>
  );
}
