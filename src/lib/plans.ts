// Subscription is the only revenue model: businesses pay monthly, clients always book for free.

export const TRIAL_DAYS = 30;

export const PLANS = {
  trial: { staffLimit: 10, priceTl: 0 },
  solo: { staffLimit: 1, priceTl: 390 },
  salon: { staffLimit: 10, priceTl: 890 },
} as const;

export type PlanId = keyof typeof PLANS;
export const PAID_PLANS = ["solo", "salon"] as const;
export const isPlan = (s: unknown): s is PlanId => typeof s === "string" && s in PLANS;

type Sub = { plan: string; trialEndsAt: Date; paidUntil: Date | null };

export function subscriptionState(b: Sub, now = new Date()) {
  if (b.paidUntil && b.paidUntil > now) return { active: true, kind: "paid" as const, until: b.paidUntil };
  if (b.trialEndsAt > now) return { active: true, kind: "trial" as const, until: b.trialEndsAt };
  return { active: false, kind: "expired" as const, until: b.paidUntil ?? b.trialEndsAt };
}

export function daysLeft(until: Date, now = new Date()) {
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / 86_400_000));
}

/** How many active staff members the business may have right now. */
export function staffLimit(b: Sub) {
  const st = subscriptionState(b);
  if (st.kind === "trial") return PLANS.trial.staffLimit;
  return isPlan(b.plan) ? PLANS[b.plan].staffLimit : PLANS.solo.staffLimit;
}
