"use client";

import { useMemo, useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "./forms";

type Hours = { weekday: number; openMin: number; closeMin: number };
type Labels = {
  service: string;
  staff: string;
  any: string;
  date: string;
  time: string;
  closed: string;
  name: string;
  phone: string;
  note: string;
  submit: string;
  min: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const weekdayOf = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** Owner adds a phone / walk-in booking. Times follow the business grid; the server re-checks availability. */
export function ManualBookingForm({
  action,
  services,
  staff,
  hours,
  slotStep,
  defaultDate,
  t,
}: {
  action: FormAction;
  services: { id: string; name: string; durationMin: number }[];
  staff: { id: string; name: string }[];
  hours: Hours[];
  slotStep: number;
  defaultDate: string;
  t: Labels;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const duration = services.find((s) => s.id === serviceId)?.durationMin ?? 30;

  const times = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const wd = weekdayOf(date);
    const out: number[] = [];
    for (const iv of hours.filter((h) => h.weekday === wd).sort((a, b) => a.openMin - b.openMin)) {
      for (let m = iv.openMin; m + duration <= iv.closeMin; m += Math.max(5, slotStep)) out.push(m);
    }
    return out;
  }, [date, duration, hours, slotStep]);

  return (
    <ActionForm action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">{t.service}</span>
          <select className="input" name="serviceId" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin} {t.min}
              </option>
            ))}
          </select>
        </label>
        {staff.length > 0 && (
          <label>
            <span className="label">{t.staff}</span>
            <select className="input" name="staffId" defaultValue="">
              <option value="">{t.any}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className="label">{t.date}</span>
          <input className="input" type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          <span className="label">{t.time}</span>
          {/* any time is allowed for the owner; grid times are offered as suggestions */}
          <input
            key={`${date}-${serviceId}`}
            className="input"
            type="time"
            name="time"
            step={300}
            list="manual-times"
            defaultValue={times.length ? hhmm(times[0]) : ""}
            required
          />
          <datalist id="manual-times">
            {times.map((m) => (
              <option key={m} value={hhmm(m)} />
            ))}
          </datalist>
          {!times.length && <span className="mt-1.5 block text-[13px] text-muted">{t.closed}</span>}
        </label>
        <label>
          <span className="label">{t.name}</span>
          <input className="input" name="name" required minLength={2} maxLength={80} autoComplete="off" />
        </label>
        <label>
          <span className="label">{t.phone}</span>
          <input className="input" name="phone" type="tel" inputMode="tel" required placeholder="+90 5__ ___ __ __" />
        </label>
      </div>
      <label>
        <span className="label">{t.note}</span>
        <input className="input" name="note" maxLength={500} />
      </label>
      <div>
        <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.submit}</SubmitButton>
      </div>
    </ActionForm>
  );
}
