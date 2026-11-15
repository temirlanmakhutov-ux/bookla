"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import type { PublicDict } from "@/i18n/public";
import { Icon } from "@/components/icons";
import { bookAction } from "./actions";

type Service = { id: string; name: string; durationMin: number; priceLabel: string };
type Day = { date: string; wd: string; day: number; open: boolean; long: string };
type SlotT = { start: number; time: string };
type Soonest = { date: string; start: number; time: string; label: string };

const ME_KEY = "bookla_me";
const readMe = () => {
  try {
    return JSON.parse(localStorage.getItem(ME_KEY) ?? "{}") as { name?: string; phone?: string };
  } catch {
    return {};
  }
};

export function BookingWidget(props: {
  businessId: string;
  businessName: string;
  locale: Locale;
  services: Service[];
  staff: { id: string; name: string }[];
  days: Day[];
  /** Soonest free start per service id, computed on the server when the page was rendered. */
  soonest: Record<string, Soonest>;
  /** Service to open straight away (links from the board on the home page). */
  initialServiceId?: string;
  /** Column heads of the timetable: soonest time, service, price. */
  cols: [string, string, string];
  t: PublicDict["b"];
  bookLabel: string;
  minLabel: string;
  enabled: boolean;
}) {
  const { t, services, staff, days } = props;
  const router = useRouter();
  const [svc, setSvc] = useState<Service | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(days.find((d) => d.open)?.date ?? days[0]?.date ?? "");
  const [slots, setSlots] = useState<SlotT[] | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const reqId = useRef(0);
  const openId = useRef(0);
  const autoOpened = useRef(false);
  const daysRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLFormElement>(null);

  const load = useCallback(
    async (s: Service, d: string, st: string) => {
      const id = ++reqId.current;
      setSlots(null);
      const qs = new URLSearchParams({ business: props.businessId, service: s.id, date: d });
      if (st) qs.set("staff", st);
      try {
        const res = await fetch(`/api/slots?${qs}`, { cache: "no-store" });
        const json = (await res.json()) as { slots?: SlotT[] };
        if (id === reqId.current) setSlots(json.slots ?? []);
        return json.slots ?? [];
      } catch {
        if (id === reqId.current) setSlots([]);
        return [];
      }
    },
    [props.businessId],
  );

  async function open(s: Service) {
    const my = ++openId.current;
    const me = readMe();
    setName((n) => n || me.name || "");
    setPhone((p) => p || me.phone || "");
    setSvc(s);
    setStep(1);
    setStart(null);
    setError("");
    setStaffId("");
    // the timetable already knows the soonest free time: land on it with the time picked
    const hint = props.soonest[s.id];
    if (hint) {
      setDate(hint.date);
      const found = await load(s, hint.date, "");
      if (my !== openId.current) return;
      if (found.some((x) => x.start === hint.start)) setStart(hint.start);
      if (found.length) return;
    }
    // otherwise jump to the first open day that still has free time (look ahead up to 10 open days)
    const openDays = days.filter((d) => d.open).slice(0, 10);
    for (const d of openDays) {
      if (my !== openId.current) return;
      setDate(d.date);
      const found = await load(s, d.date, "");
      if (found.length) break;
    }
  }

  function close() {
    reqId.current++;
    openId.current++;
    setSvc(null);
  }

  // a link from the board (/b/slug?s=<service>) opens the sheet for that service
  useEffect(() => {
    if (autoOpened.current || !props.enabled || !props.initialServiceId) return;
    const s = services.find((x) => x.id === props.initialServiceId);
    if (!s) return;
    autoOpened.current = true;
    void open(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!svc) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [svc]);

  useEffect(() => {
    if (!svc || step !== 1) return;
    daysRef.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [date, svc, step]);

  function pickDay(d: string) {
    if (!svc) return;
    setDate(d);
    setStart(null);
    void load(svc, d, staffId);
  }
  function pickStaff(id: string) {
    if (!svc) return;
    setStaffId(id);
    setStart(null);
    void load(svc, date, id);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!svc || start == null) return;
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 7) {
      setError(t.fill);
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await bookAction({
        businessId: props.businessId,
        serviceId: svc.id,
        staffId: staffId || null,
        date,
        startMin: start,
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim(),
        lang: props.locale,
      });
      if (res.ok) {
        try {
          localStorage.setItem(ME_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
        } catch {}
        router.push(`/booking/${res.token}?new=1`);
        return;
      }
      if (res.error === "taken") {
        setError(t.slotTaken);
        setStep(1);
        setStart(null);
        void load(svc, date, staffId);
      } else setError(t.error);
    });
  }

  const day = days.find((d) => d.date === date);
  const selectedTime = slots?.find((s) => s.start === start)?.time;
  const staffName = staff.find((s) => s.id === staffId)?.name;
  const picked = "border-board bg-board text-white";
  const idle = "border-rule/70 bg-surface text-ink hover:border-board";
  const groupLabel = "mb-2.5 text-[15px] font-extrabold text-ink";

  return (
    <>
      <div className="card overflow-hidden">
        {props.enabled && (
          <div className="grid grid-cols-[4.75rem_1fr_auto_0.625rem] gap-3 border-b border-line bg-board-tint/60 px-3.5 py-2 text-[12px] font-extrabold text-muted" aria-hidden>
            <span>{props.cols[0]}</span>
            <span>{props.cols[1]}</span>
            <span>{props.cols[2]}</span>
            <span />
          </div>
        )}
        <ul className="rows">
          {services.map((s) => {
            const soon = props.soonest[s.id];
            const body = (
              <>
                <span className="min-w-0">
                  <span className="block text-[16px] leading-snug font-extrabold">{s.name}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {s.durationMin} {props.minLabel}
                  </span>
                </span>
                <span className="num text-[22px] whitespace-nowrap">{s.priceLabel}</span>
              </>
            );
            if (!props.enabled)
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  {body}
                </li>
              );
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s)}
                  aria-label={`${props.bookLabel}: ${s.name}${soon ? `, ${soon.label} ${soon.time}` : ""}`}
                  className="grid w-full grid-cols-[4.75rem_1fr_auto_0.625rem] items-center gap-3 px-3.5 py-3 text-left transition duration-150 hover:bg-board-tint/50 active:bg-board-tint"
                >
                  {soon ? (
                    <span className="grid h-[54px] content-center justify-items-center gap-1 rounded-[10px] bg-board">
                      <span className="num text-[25px] leading-none text-chalk">{soon.time}</span>
                      <span className="text-[11px] leading-none font-bold text-board-ink">{soon.label}</span>
                    </span>
                  ) : (
                    <span className="grid h-[54px] place-items-center rounded-[10px] bg-board-tint text-board">
                      <Icon name="calendar" />
                    </span>
                  )}
                  {body}
                  <Icon name="chevronRight" className="-ml-1 size-4 text-rule" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {svc && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bk-title">
          <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 animate-[fadeIn_.2s_ease-out] bg-ink/55" onClick={close} />
          <form
            ref={sheetRef}
            tabIndex={-1}
            onSubmit={submit}
            className="relative flex max-h-[92dvh] w-full max-w-lg animate-[sheetUp_.36s_var(--ease-out-expo)] flex-col overflow-hidden rounded-t-[26px] bg-surface shadow-[var(--shadow-sheet)] outline-none sm:rounded-[26px]"
          >
            <div className="bg-board px-5 pt-4 text-white">
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <h3 id="bk-title" className="sign-sm text-[26px] [overflow-wrap:anywhere]">
                    {svc.name}
                  </h3>
                  <p className="mt-1 text-[14px] font-semibold text-board-ink">
                    {props.businessName} · {svc.durationMin} {props.minLabel} · {svc.priceLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mt-1 -mr-2 ml-auto grid size-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white hover:text-board"
                >
                  <Icon name="close" />
                </button>
              </div>
              <ol className="mt-3 flex gap-5 text-[14px] font-extrabold">
                {[t.time, t.contacts].map((label, i) => {
                  const on = step === i + 1;
                  return (
                    <li key={label} aria-current={on ? "step" : undefined} className={`flex items-center gap-1.5 border-b-[3px] pb-2.5 ${on ? "border-chalk text-white" : "border-transparent text-board-ink"}`}>
                      <span className="num text-[18px] leading-none">{i + 1}</span>
                      {label}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
              {error && (
                <p role="alert" className="mb-4 rounded-xl bg-danger-tint px-3.5 py-2.5 text-sm font-bold text-danger">
                  {error}
                </p>
              )}
              {step === 1 ? (
                <>
                  {staff.length > 0 && (
                    <>
                      <p className={groupLabel}>{t.staff}</p>
                      <div className="mb-5 flex flex-wrap gap-2">
                        {[{ id: "", name: t.any }, ...staff].map((s) => (
                          <button
                            key={s.id || "any"}
                            type="button"
                            aria-pressed={staffId === s.id}
                            onClick={() => pickStaff(s.id)}
                            className={`h-11 rounded-xl border-[1.5px] px-3.5 text-[15px] font-bold transition duration-150 ${staffId === s.id ? picked : idle}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className={groupLabel}>{t.date}</p>
                  <div ref={daysRef} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
                    {days.map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        disabled={!d.open}
                        aria-pressed={d.date === date}
                        aria-label={d.long}
                        onClick={() => pickDay(d.date)}
                        className={`flex h-[68px] w-[54px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] transition duration-150 ${
                          d.date === date ? picked : `${idle} disabled:border-transparent disabled:bg-transparent disabled:text-rule`
                        }`}
                      >
                        <small className={`text-[12px] leading-none font-bold capitalize ${d.date === date ? "text-board-ink" : d.open ? "text-muted" : ""}`}>{d.wd}</small>
                        <b className="num text-[26px] leading-none">{d.day}</b>
                      </button>
                    ))}
                  </div>
                  <p className={`mt-5 ${groupLabel}`}>{t.time}</p>
                  {slots === null ? (
                    <div className="grid grid-cols-4 gap-2" aria-label={t.loading}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`h-12 animate-pulse rounded-xl bg-board-tint ${i === 0 ? "col-span-2" : ""}`} />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="rounded-xl bg-paper p-5 text-center text-[15px] text-muted">{day && !day.open ? t.closedDay : t.noSlots}</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((s, i) => (
                        <button
                          key={s.start}
                          type="button"
                          aria-pressed={s.start === start}
                          onClick={() => setStart(s.start)}
                          className={`h-12 rounded-xl border-[1.5px] transition duration-150 ${s.start === start ? picked : idle} ${
                            i === 0 ? "col-span-2 flex items-center justify-between px-3.5" : ""
                          }`}
                        >
                          {i === 0 && <span className={`text-[13px] font-bold ${s.start === start ? "text-board-ink" : "text-muted"}`}>{t.soonest}</span>}
                          <span className={`num text-[21px] ${i === 0 && s.start === start ? "text-chalk" : ""}`}>{s.time}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 rounded-[14px] bg-board px-4 py-3 text-white">
                    <span className="num text-[40px] leading-none text-chalk">{selectedTime}</span>
                    <span className="min-w-0 text-[15px] leading-snug font-bold">
                      <span className="block first-letter:uppercase">{day?.long}</span>
                      {staff.length > 0 && <span className="block text-board-ink">{staffName ?? t.any}</span>}
                    </span>
                  </div>
                  <label>
                    <span className="label">{t.name}</span>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80} />
                  </label>
                  <label>
                    <span className="label">{t.phone}</span>
                    <input
                      className="input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+90 5__ ___ __ __"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <span className="mt-1.5 block text-[13px] text-muted">{t.phoneHint}</span>
                  </label>
                  <label>
                    <span className="label">{t.note}</span>
                    <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} />
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-line bg-surface px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {step === 1 ? (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    {selectedTime ? (
                      <>
                        <div className="num text-[28px] leading-none text-board">{selectedTime}</div>
                        <div className="mt-1 truncate text-[13px] font-bold text-muted">
                          {day?.long}
                          {staffName ? ` · ${staffName}` : ""}
                        </div>
                      </>
                    ) : (
                      <p className="text-[15px] font-bold text-muted">{t.pickTime}</p>
                    )}
                  </div>
                  <button type="button" className="btn btn-primary btn-lg shrink-0" disabled={start == null} onClick={() => setStep(2)}>
                    {t.next}
                    <Icon name="arrow" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" className="btn btn-line btn-lg px-4" onClick={() => setStep(1)} aria-label="Back">
                    <Icon name="chevronLeft" />
                  </button>
                  <button className="btn btn-stamp btn-lg flex-1" disabled={pending}>
                    {pending ? t.confirming : t.confirm}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
