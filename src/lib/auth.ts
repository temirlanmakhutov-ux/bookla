import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "bk_session";
const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function createSession(ownerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { id: sha256(token), ownerId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

/** The signed-in owner (with their business) or null. Memoised per request. */
export const getOwner = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { owner: { include: { business: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { passwordHash: _omit, ...owner } = session.owner;
  void _omit;
  return owner;
});

export async function requireOwner() {
  const owner = await getOwner();
  if (!owner) redirect("/biz/login");
  return owner;
}

/** Owner + their business; owners without a business are sent to finish sign-up. */
export async function requireBusiness() {
  const owner = await requireOwner();
  if (!owner.business) redirect("/biz/signup");
  return { owner, business: owner.business };
}

export function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function requireAdmin() {
  const owner = await requireOwner();
  if (!isAdmin(owner.email)) redirect("/dashboard");
  return owner;
}
