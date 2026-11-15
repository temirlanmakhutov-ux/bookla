"use server";

import { z } from "zod";
import { createBooking, type CreateBookingResult } from "@/lib/booking";

const Input = z.object({
  businessId: z.string().min(1).max(40),
  serviceId: z.string().min(1).max(40),
  staffId: z.string().max(40).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.number().int().min(0).max(1440),
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(30),
  note: z.string().max(500),
  lang: z.string().max(2),
});

export async function bookAction(raw: unknown): Promise<CreateBookingResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return createBooking(parsed.data, "online");
}
