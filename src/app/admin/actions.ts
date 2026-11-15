"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PAID_PLANS } from "@/lib/plans";
import { addMonths } from "@/app/dashboard/_lib";

/** Records a manual payment: +1 month of the plan, counted from today or from the current end date. */
export async function extendPlanAction(businessId: string, plan: string) {
  await requireAdmin();
  if (!(PAID_PLANS as readonly string[]).includes(plan)) return;
  const b = await prisma.business.findUnique({ where: { id: businessId }, select: { paidUntil: true } });
  if (!b) return;
  const now = new Date();
  const from = b.paidUntil && b.paidUntil > now ? b.paidUntil : now;
  await prisma.business.update({ where: { id: businessId }, data: { plan, paidUntil: addMonths(from, 1) } });
  revalidatePath("/admin");
}

export async function togglePublishedAction(businessId: string) {
  await requireAdmin();
  const b = await prisma.business.findUnique({ where: { id: businessId }, select: { published: true } });
  if (!b) return;
  await prisma.business.update({ where: { id: businessId }, data: { published: !b.published } });
  revalidatePath("/admin");
}
