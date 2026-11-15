import Link from "next/link";
import { initials } from "@/lib/catalog";
import { Icon } from "./icons";

/** Wordmark as sign lettering. Always sits on the cobalt board. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Bookla" className={`sign text-[34px] leading-none text-white ${className}`}>
      book<span className="text-chalk">la</span>
    </Link>
  );
}

/** Enamel plate with the business initials (used until businesses upload photos). */
export function Mono({ name, size = "md" }: { name: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "size-11 rounded-[11px] text-[22px]" : size === "lg" ? "size-16 rounded-[16px] text-[34px]" : "size-14 rounded-[14px] text-[28px]";
  return (
    <div className={`num grid shrink-0 place-items-center bg-board text-white ${s}`} aria-hidden>
      {initials(name)}
    </div>
  );
}

export function Stars({ rating, count, onBoard = false }: { rating: number | null; count: number; onBoard?: boolean }) {
  if (rating == null) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] ${onBoard ? "text-board-ink" : "text-muted"}`}>
      <Icon name="star" filled className={`size-3.5 ${onBoard ? "text-chalk" : "text-chalk-deep"}`} />
      <b className={`font-extrabold tabular-nums ${onBoard ? "text-white" : "text-ink"}`}>{rating.toFixed(1)}</b>
      <span className="tabular-nums">({count})</span>
    </span>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-tint px-3.5 py-2.5 text-sm font-bold text-danger">
      {message}
    </p>
  );
}
