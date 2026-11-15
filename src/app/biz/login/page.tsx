import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getOwner } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { common } from "@/i18n/common";
import { LoginForm } from "../AuthForms";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getOwner()) redirect("/dashboard");
  const t = common[await getLocale()].auth;
  return (
    <>
      <SiteHeader />
      <main className="container-app grid justify-items-center py-8 sm:py-14">
        <div className="w-full max-w-md">
          <h1 className="sign text-[44px] text-balance text-board sm:text-[56px]">{t.loginTitle}</h1>
          <p className="mt-2 mb-6 text-[17px] text-muted">{t.loginSub}</p>
          <div className="panel p-5 sm:p-7">
          <LoginForm t={t} />
          </div>
        </div>
      </main>
    </>
  );
}
