"use server";

import { revalidatePath } from "next/cache";
import { cancelByClient } from "@/lib/booking";

export type CancelState = { result?: "ok" | "not_found" | "too_late" } | undefined;

export async function cancelAction(_prev: CancelState, fd: FormData): Promise<CancelState> {
  const token = String(fd.get("token") ?? "");
  if (!token) return { result: "not_found" };
  const result = await cancelByClient(token);
  revalidatePath(`/booking/${token}`);
  return { result };
}
