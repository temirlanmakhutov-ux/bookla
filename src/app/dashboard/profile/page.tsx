import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/auth";
import { businessLink } from "@/lib/booking";
import { CATEGORIES, CITIES, categoryName, cityName } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { fmt } from "@/i18n/locales";
import { ActionForm, CopyButton, SubmitButton } from "@/components/dashboard/forms";
import { saveProfileAction } from "../actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { business: b } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const p = t.profile;
  const link = businessLink(b.slug);
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 512, color: { dark: "#071A44", light: "#FFFFFF" } });
  const langs = b.languages.split(",");

  return (
    <div className="grid gap-6">
      <h1 className="h-page">{p.title}</h1>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <ActionForm action={saveProfileAction} className="grid gap-5">
          <section className="card grid gap-3.5 p-4 sm:p-6">
            <h2 className="h-section">{p.main}</h2>
            <label>
              <span className="label">{p.name}</span>
              <input className="input" name="name" required maxLength={80} defaultValue={b.name} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">{p.category}</span>
                <select className="input" name="category" defaultValue={b.category}>
                  {CATEGORIES.map((c) => (
                    <option key={c[0]} value={c[0]}>
                      {categoryName(c[0], locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{p.city}</span>
                <select className="input" name="city" defaultValue={b.city}>
                  {CITIES.map((c) => (
                    <option key={c[0]} value={c[0]}>
                      {cityName(c[0], locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{p.area}</span>
                <input className="input" name="area" maxLength={80} defaultValue={b.area} />
              </label>
              <label>
                <span className="label">{p.phone}</span>
                <input className="input" name="phone" type="tel" inputMode="tel" required defaultValue={`+${b.phone}`} />
              </label>
            </div>
            <label>
              <span className="label">{p.address}</span>
              <input className="input" name="address" maxLength={200} defaultValue={b.address} />
            </label>
            <label>
              <span className="label">{p.about}</span>
              <textarea className="input" name="about" maxLength={1000} rows={3} defaultValue={b.about} />
            </label>
            <fieldset>
              <legend className="label">{p.languages}</legend>
              <div className="flex flex-wrap gap-2">
                {(["TR", "EN", "RU"] as const).map((l) => (
                  <label key={l} className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-rule bg-surface px-3.5 font-extrabold has-checked:border-board has-checked:bg-board-tint has-checked:text-board">
                    <input type="checkbox" name="languages" value={l} defaultChecked={langs.includes(l)} className="size-4 accent-board" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid">
              <label>
                <span className="label">{p.slug}</span>
                <div className="flex items-center rounded-xl border-[1.5px] border-rule bg-surface transition focus-within:border-board focus-within:ring-[3px] focus-within:ring-board/25">
                  <span className="pl-3.5 text-sm whitespace-nowrap text-muted">/b/</span>
                  <input
                    className="h-12 w-full min-w-0 rounded-r-xl bg-transparent pr-3.5 pl-0.5 text-base outline-none focus-visible:shadow-none"
                    name="slug"
                    required
                    minLength={3}
                    maxLength={40}
                    pattern="[a-z0-9\-]+"
                    defaultValue={b.slug}
                  />
                </div>
                <span className="mt-1.5 block text-[13px] text-muted">{p.slugHint}</span>
              </label>
            </div>
          </section>

          <section className="card grid gap-3.5 p-4 sm:p-6">
            <h2 className="h-section">{p.rules}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">{p.slotStep}</span>
                <select className="input" name="slotStep" defaultValue={String(b.slotStep)}>
                  {[15, 30, 60].map((m) => (
                    <option key={m} value={m}>
                      {fmt(p.minutes, { n: m })}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{p.capacity}</span>
                <input className="input" name="capacity" type="number" inputMode="numeric" min={1} max={100} required defaultValue={b.capacity} />
              </label>
              <label>
                <span className="label">{p.minNotice}</span>
                <input className="input" name="minNoticeMin" type="number" inputMode="numeric" min={0} max={2880} step={15} required defaultValue={b.minNoticeMin} />
              </label>
              <label>
                <span className="label">{p.maxDays}</span>
                <input className="input" name="maxDaysAhead" type="number" inputMode="numeric" min={1} max={365} required defaultValue={b.maxDaysAhead} />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{p.cancelHours}</span>
                <input className="input sm:max-w-[200px]" name="cancelHours" type="number" inputMode="numeric" min={0} max={168} required defaultValue={b.cancelHours} />
              </label>
            </div>
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl bg-paper p-3.5">
              <input type="checkbox" name="published" defaultChecked={b.published} className="size-5 accent-board" />
              <span className="font-extrabold">{p.published}</span>
            </label>
          </section>

          <div>
            <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.common.save}</SubmitButton>
          </div>
        </ActionForm>

        <aside className="card grid gap-3 p-4 sm:p-5 lg:sticky lg:top-20">
          <h2 className="h-section">{p.link}</h2>
          <a href={link} target="_blank" rel="noopener" className="font-extrabold break-all text-board">
            {link.replace(/^https?:\/\//, "")}
          </a>
          <div className="flex gap-2">
            <CopyButton text={link} label={t.common.copy} doneLabel={t.common.copied} className="btn btn-ghost btn-sm flex-1" />
            <a href={link} target="_blank" rel="noopener" className="btn btn-line btn-sm flex-1">
              {t.common.open}
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
          <img src={qr} alt={`QR: ${link}`} width={256} height={256} className="mx-auto mt-1 w-full max-w-[220px] rounded-xl border border-line" />
          <a href={qr} download={`bookla-${b.slug}-qr.png`} className="btn btn-primary btn-sm">
            {p.downloadQr}
          </a>
          <p className="text-[13px] text-muted">{p.qrHint}</p>
        </aside>
      </div>
    </div>
  );
}
