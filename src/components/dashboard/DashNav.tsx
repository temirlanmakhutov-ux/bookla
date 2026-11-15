"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Section tabs on the cobalt shell; the current one carries the chalk underline. */
export function DashNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  // Keep the current tab in view on phones, where the row scrolls sideways.
  useEffect(() => {
    const nav = ref.current;
    const on = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !on) return;
    nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
  }, [path]);
  return (
    <nav ref={ref} className="no-scrollbar -mx-5 flex overflow-x-auto px-3 sm:-mx-2 sm:px-0" aria-label={label}>
      {items.map((it) => {
        const on = it.href === "/dashboard" ? path === "/dashboard" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`relative inline-flex h-12 shrink-0 items-center px-2.5 text-[15px] font-extrabold whitespace-nowrap transition ${
              on
                ? "text-white after:absolute after:inset-x-2.5 after:bottom-0 after:h-1 after:rounded-t-full after:bg-chalk"
                : "text-board-ink hover:text-white"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
