"use client";

import { useEffect, useRef, useState, useTransition, type ComponentProps } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";

type Props = Omit<ComponentProps<"form">, "action" | "onSubmit"> & {
  action: (data: FormData) => void;
  confirmation?: { title: string; consequence: string; label: string };
  resetOnSuccess?: boolean;
};

/** Client-owned drafts survive rejected actions; server validation remains authoritative. */
export function AdminActionForm({ action, confirmation, resetOnSuccess = false, children, ...props }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (resetOnSuccess && !pending) form.current?.reset();
  }, [resetOnSuccess, pending]);
  function submit() {
    if (pending || !form.current?.reportValidity()) return;
    const data = new FormData(form.current);
    setConfirming(false);
    startTransition(() => action(data));
  }
  return <>
    <form {...props} ref={form} action={action} aria-busy={pending} onSubmit={event => {
      event.preventDefault();
      if (pending) return;
      if (confirmation) setConfirming(true); else submit();
    }}>
      <fieldset className="admin-action-fields" disabled={pending}>{children}</fieldset>
    </form>
    {confirmation && <div {...{ onCancel: (event: React.SyntheticEvent) => event.stopPropagation(), onClose: (event: React.SyntheticEvent) => event.stopPropagation() }}><ConfirmDialog open={confirming} size="compact" intent="danger" title={confirmation.title} consequence={confirmation.consequence} confirmLabel={confirmation.label} onCancel={() => setConfirming(false)} onConfirm={submit}/></div>}

  </>;
}
