"use client";

import { useState } from "react";
import { Icon } from "./icons";

export function ShareButton({ url, title, label, copiedLabel, className = "" }: { url: string; title: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user closed the share sheet */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(label, url);
    }
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon name="share" className="size-[18px]" />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
