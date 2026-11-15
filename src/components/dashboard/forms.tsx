"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/ui";

export type ActionState = { error?: string; ok?: string } | undefined;
export type FormAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/** Form bound to a server action that returns { error } or { ok } messages. */
export function ActionForm({
  action,
  children,
  className = "",
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);
  return (
    <form action={formAction} className={className}>
      <FormError message={state?.error} />
      {state?.ok && (
        <p role="status" className="rounded-xl bg-ok-tint px-3.5 py-2.5 text-sm font-bold text-ok-ink">
          {state.ok}
        </p>
      )}
      {children}
    </form>
  );
}

export function SubmitButton({ children, className = "btn btn-primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {children}
    </button>
  );
}

/** Submit button that asks for confirmation first (e.g. cancelling a booking). */
export function ConfirmSubmit({
  children,
  message,
  className = "btn btn-danger btn-sm",
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function CopyButton({
  text,
  label,
  doneLabel,
  className = "btn btn-ghost btn-sm",
}: {
  text: string;
  label: string;
  doneLabel: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt(label, text);
        }
      }}
    >
      {done ? doneLabel : label}
    </button>
  );
}
