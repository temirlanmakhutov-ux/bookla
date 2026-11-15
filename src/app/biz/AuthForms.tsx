"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthState } from "./actions";
import { FormError } from "@/components/ui";
import type { CommonDict } from "@/i18n/common";

type Opt = { id: string; label: string };

export function LoginForm({ t }: { t: CommonDict["auth"] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <FormError message={state?.error} />
      <label>
        <span className="label">{t.email}</span>
        <input className="input" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
      </label>
      <label>
        <span className="label">{t.password}</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn-primary btn-lg mt-2" disabled={pending}>
        {t.signIn}
      </button>
      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href="/biz/signup" className="font-extrabold text-board underline decoration-2 underline-offset-4">
          {t.createAccount}
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ t, categories, cities }: { t: CommonDict["auth"]; categories: Opt[]; cities: Opt[] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, undefined);
  const v = state?.values ?? {};
  return (
    <form action={action} className="grid gap-4">
      <FormError message={state?.error} />
      <label>
        <span className="label">{t.businessName}</span>
        <input className="input" name="businessName" required maxLength={80} defaultValue={v.businessName} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t.category}</span>
          <select className="input" name="category" required defaultValue={v.category ?? ""}>
            <option value="" disabled>
              —
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">{t.city}</span>
          <select className="input" name="city" required defaultValue={v.city ?? ""}>
            <option value="" disabled>
              —
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="label">{t.phone}</span>
        <input className="input" name="phone" type="tel" inputMode="tel" required placeholder="+90 533 ___ __ __" defaultValue={v.phone} />
        <span className="mt-1.5 block text-[13px] text-muted">{t.phoneHint}</span>
      </label>
      <label>
        <span className="label">{t.ownerName}</span>
        <input className="input" name="ownerName" autoComplete="name" required maxLength={80} defaultValue={v.ownerName} />
      </label>
      <label>
        <span className="label">{t.email}</span>
        <input className="input" name="email" type="email" autoComplete="email" required defaultValue={v.email} />
      </label>
      <label>
        <span className="label">{t.password}</span>
        <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="mt-1.5 block text-[13px] text-muted">{t.passwordHint}</span>
      </label>
      <button className="btn btn-primary btn-lg mt-2" disabled={pending}>
        {t.createAccount}
      </button>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href="/biz/login" className="font-extrabold text-board underline decoration-2 underline-offset-4">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
