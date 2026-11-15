import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { hhmm } from "@/lib/time";
import { getLocale } from "@/i18n/server";
import { dashboardDict } from "@/i18n/dashboard";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";
import { saveHoursAction } from "../actions";
import { WEEK_ORDER, weekdayName } from "../_lib";

export const metadata: Metadata = { title: "Hours" };

export default async function HoursPage() {
  const { business } = await requireBusiness();
  const locale = await getLocale();
  const t = dashboardDict[locale];
  const hours = await prisma.workingHours.findMany({ where: { businessId: business.id }, orderBy: { openMin: "asc" } });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="h-page">{t.hours.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">{t.hours.hint}</p>
      </div>

      <ActionForm action={saveHoursAction} className="grid max-w-2xl gap-3">
        <div className="card rows">
          {WEEK_ORDER.map((wd) => {
            const h = hours.find((x) => x.weekday === wd);
            return (
              <div key={wd} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <label className="flex w-40 cursor-pointer items-center gap-3">
                  <input type="checkbox" name={`works-${wd}`} defaultChecked={!!h} className="size-5 accent-board" />
                  <span className="inline-block font-extrabold first-letter:uppercase">{weekdayName(wd, locale)}</span>
                </label>
                <div className="flex flex-1 items-center gap-2">
                  <label className="flex-1">
                    <span className="sr-only">{t.hours.from}</span>
                    <input className="input h-11 font-bold tabular-nums" type="time" name={`open-${wd}`} defaultValue={hhmm(h?.openMin ?? 540)} step={300} />
                  </label>
                  <span className="text-muted">–</span>
                  <label className="flex-1">
                    <span className="sr-only">{t.hours.to}</span>
                    <input className="input h-11 font-bold tabular-nums" type="time" name={`close-${wd}`} defaultValue={hhmm(h?.closeMin ?? 1140)} step={300} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.common.save}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
