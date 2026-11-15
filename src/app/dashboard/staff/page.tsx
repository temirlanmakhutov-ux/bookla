import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { staffLimit } from "@/lib/plans";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { fmt } from "@/i18n/locales";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";
import { Icon } from "@/components/icons";
import { addStaffAction, renameStaffAction, toggleStaffAction } from "../actions";
import { staffColor } from "../_lib";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const staff = await prisma.staff.findMany({ where: { businessId: business.id }, orderBy: [{ sort: "asc" }, { name: "asc" }] });
  const ids = staff.map((s) => s.id);
  const limit = staffLimit(business);
  const activeCount = staff.filter((s) => s.active).length;
  const full = activeCount >= limit;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="h-page">{t.staff.title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">{t.staff.hint}</p>
        </div>
        <p className="text-sm text-muted">
          <b className="num mr-1.5 align-[-0.1em] text-[26px] text-ink">
            {activeCount}/{limit}
          </b>
          {fmt(t.staff.limit, { n: limit })}
        </p>
      </div>

      {full ? (
        <p className="rounded-xl bg-chalk-tint p-4 text-[15px] text-ink">
          {fmt(t.staff.limitReached, { n: limit })}{" "}
          <Link href="/dashboard/billing" className="font-extrabold underline decoration-2">
            {t.staff.upgrade}
          </Link>
        </p>
      ) : (
        <ActionForm action={addStaffAction} className="grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">{t.staff.name}</span>
              <input className="input" name="name" placeholder={t.staff.name} required maxLength={40} />
            </label>
            <SubmitButton className="btn btn-primary">
              <Icon name="plus" className="size-[18px]" />
              {t.staff.add}
            </SubmitButton>
          </div>
        </ActionForm>
      )}

      {staff.length === 0 ? (
        <p className="py-4 text-center text-muted">{t.staff.empty}</p>
      ) : (
        <div className="card rows">
          {staff.map((s) => (
            <article key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 items-center gap-3 sm:w-52">
                <span
                  className="num grid size-11 shrink-0 place-items-center rounded-[11px] text-[22px] text-white"
                  style={{ background: s.active ? staffColor(ids, s.id) : "#8492b4" }}
                  aria-hidden
                >
                  {s.name.slice(0, 1).toUpperCase()}
                </span>
                <span className={`truncate text-[17px] font-extrabold ${s.active ? "" : "text-muted"}`}>{s.name}</span>
                {!s.active && <span className="chip chip-gray">{t.staff.inactive}</span>}
              </div>
              <ActionForm action={renameStaffAction.bind(null, s.id)} className="grid flex-1 gap-2">
                <div className="flex gap-2">
                  <input className="input h-10" name="name" defaultValue={s.name} required maxLength={40} aria-label={t.staff.name} />
                  <SubmitButton className="btn btn-line btn-sm">{t.common.save}</SubmitButton>
                </div>
              </ActionForm>
              <ActionForm action={toggleStaffAction.bind(null, s.id)} className="grid gap-2">
                <SubmitButton className={`btn btn-sm ${s.active ? "btn-danger" : "btn-ghost"}`}>
                  {s.active ? t.staff.deactivate : t.staff.activate}
                </SubmitButton>
              </ActionForm>
            </article>
          ))}
        </div>
      )}

      <p className="max-w-2xl text-sm text-muted">{t.staff.noStaffHint}</p>
    </div>
  );
}
