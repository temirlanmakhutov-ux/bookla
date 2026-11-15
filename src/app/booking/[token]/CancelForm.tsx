"use client";

import { useActionState } from "react";
import { cancelAction, type CancelState } from "./actions";

export function CancelForm({ token, label, question, tooLate }: { token: string; label: string; question: string; tooLate: string }) {
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelAction, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
      className="mt-4 grid gap-2"
    >
      <input type="hidden" name="token" value={token} />
      {state?.result === "too_late" && (
        <p role="alert" className="rounded-xl bg-chalk-tint px-3.5 py-2.5 text-sm font-bold text-ink">
          {tooLate}
        </p>
      )}
      <button className="btn btn-danger w-full" disabled={pending}>
        {label}
      </button>
    </form>
  );
}
