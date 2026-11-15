"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, isAdmin, verifyPassword } from "@/lib/auth";
import { isCategory, isCity, normalizePhone, slugify } from "@/lib/catalog";
import { TRIAL_DAYS } from "@/lib/plans";
import { getLocale } from "@/i18n/server";
import { common } from "@/i18n/common";

export type AuthState = { error?: string; values?: Record<string, string> } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const t = common[await getLocale()].auth;
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: t.required, values: { email } };
  const owner = await prisma.owner.findUnique({ where: { email }, include: { business: { select: { id: true } } } });
  if (!owner || !(await verifyPassword(password, owner.passwordHash))) return { error: t.invalid, values: { email } };
  await createSession(owner.id);
  redirect(!owner.business && isAdmin(owner.email) ? "/admin" : "/dashboard");
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "isletme";
  let slug = base;
  for (let i = 2; await prisma.business.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
  return slug;
}

export async function signupAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const t = common[locale].auth;
  const values = {
    ownerName: str(fd, "ownerName"),
    email: str(fd, "email").toLowerCase(),
    businessName: str(fd, "businessName"),
    category: str(fd, "category"),
    city: str(fd, "city"),
    phone: str(fd, "phone"),
  };
  const password = String(fd.get("password") ?? "");
  if (Object.values(values).some((v) => !v) || !password) return { error: t.required, values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: t.badEmail, values };
  if (password.length < 8) return { error: t.passwordShort, values };
  const phone = normalizePhone(values.phone);
  if (phone.length < 10 || phone.length > 15) return { error: t.badPhone, values };
  if (!isCategory(values.category) || !isCity(values.city)) return { error: t.required, values };
  if (await prisma.owner.findUnique({ where: { email: values.email }, select: { id: true } })) {
    return { error: t.emailTaken, values };
  }

  const owner = await prisma.owner.create({
    data: {
      email: values.email,
      name: values.ownerName.slice(0, 80),
      passwordHash: await hashPassword(password),
      lang: locale,
      business: {
        create: {
          slug: await uniqueSlug(values.businessName),
          name: values.businessName.slice(0, 80),
          category: values.category,
          city: values.city,
          phone,
          languages: locale === "ru" ? "TR,EN,RU" : "TR,EN",
          trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
          // Mon–Sat 09:00–19:00 to start with; the owner edits it in the dashboard
          hours: { create: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, openMin: 540, closeMin: 1140 })) },
          staff: { create: [{ name: values.ownerName.slice(0, 40) }] },
        },
      },
    },
  });
  await createSession(owner.id);
  redirect("/dashboard?welcome=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
