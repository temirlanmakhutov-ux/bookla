import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { money, serviceName } from "@/lib/catalog";
import { getLocale } from "@/i18n/server";
import { dashboardDict, type DashboardDict } from "@/i18n/dashboard";
import { common } from "@/i18n/common";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";
import { Icon } from "@/components/icons";
import { addServiceAction, deleteServiceAction, toggleServiceAction, updateServiceAction } from "../actions";

export const metadata: Metadata = { title: "Services" };

type ServiceValues = { nameTr: string; nameEn: string; nameRu: string; durationMin: number; price: number; sort: number };

function ServiceFields({ t, v }: { t: DashboardDict; v?: ServiceValues }) {
  const s = t.services;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className="label">{s.nameTr}</span>
          <input className="input" name="nameTr" required maxLength={80} defaultValue={v?.nameTr} />
        </label>
        <label>
          <span className="label">{s.nameEn}</span>
          <input className="input" name="nameEn" maxLength={80} defaultValue={v?.nameEn} />
        </label>
        <label>
          <span className="label">{s.nameRu}</span>
          <input className="input" name="nameRu" maxLength={80} defaultValue={v?.nameRu} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label>
          <span className="label">{s.duration}</span>
          <input className="input" name="durationMin" type="number" inputMode="numeric" min={5} max={720} step={5} required defaultValue={v?.durationMin ?? 60} />
        </label>
        <label>
          <span className="label">{s.price}</span>
          <input className="input" name="price" type="number" inputMode="numeric" min={0} step={10} required defaultValue={v?.price ?? 0} />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="label">{s.sort}</span>
          <input className="input" name="sort" type="number" inputMode="numeric" defaultValue={v?.sort ?? 0} />
        </label>
      </div>
    </>
  );
}

export default async function ServicesPage() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: [{ active: "desc" }, { sort: "asc" }, { nameTr: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="h-page">{t.services.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">{t.services.hint}</p>
      </div>

      <details className="card group" open={services.length === 0}>
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-[18px] p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-board text-white">
            <Icon name="plus" />
          </span>
          <span className="flex-1 text-[17px] font-extrabold">{t.services.add}</span>
          <Icon name="chevronDown" className="size-5 text-muted transition group-open:rotate-180" />
        </summary>
        <ActionForm action={addServiceAction} className="grid gap-3 border-t border-line p-4 sm:p-5">
          <ServiceFields t={t} />
          <div>
            <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.common.add}</SubmitButton>
          </div>
        </ActionForm>
      </details>

      {services.length === 0 ? (
        <p className="py-6 text-center text-muted">{t.services.empty}</p>
      ) : (
        <div className="card rows">
          {services.map((s) => (
            <article key={s.id} className="p-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[17px] font-extrabold ${s.active ? "" : "text-muted"}`}>{serviceName(s, locale)}</span>
                    {!s.active && <span className="chip chip-gray">{t.common.hidden}</span>}
                  </div>
                  <div className="mt-0.5 text-[15px] text-muted">
                    {s.durationMin} {t.common.min}
                  </div>
                </div>
                <span className={`num text-[26px] whitespace-nowrap ${s.active ? "" : "text-muted"}`}>{money(s.price, locale, common[locale].free)}</span>
              </div>
              <div className="mt-1.5 text-[13px] text-muted">
                TR: {s.nameTr}
                {s.nameEn && ` · EN: ${s.nameEn}`}
                {s.nameRu && ` · RU: ${s.nameRu}`}
              </div>
              <details className="group/edit mt-3">
                <summary className="flex list-none flex-wrap items-center gap-1.5 [&::-webkit-details-marker]:hidden">
                  <span className="btn btn-ghost btn-sm cursor-pointer">
                    {t.common.edit}
                    <Icon name="chevronDown" className="size-4 transition group-open/edit:rotate-180" />
                  </span>
                </summary>
                <ActionForm action={updateServiceAction.bind(null, s.id)} className="mt-3 grid gap-3">
                  <ServiceFields t={t} v={s} />
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.common.save}</SubmitButton>
                  </div>
                </ActionForm>
              </details>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <form action={toggleServiceAction.bind(null, s.id)}>
                  <SubmitButton className="btn btn-line btn-sm">{s.active ? t.common.hide : t.common.show}</SubmitButton>
                </form>
                <ActionForm action={deleteServiceAction.bind(null, s.id)} className="contents">
                  <SubmitButton className="btn btn-danger btn-sm">{t.common.delete}</SubmitButton>
                </ActionForm>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
