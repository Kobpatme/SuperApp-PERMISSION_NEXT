"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";

type CloseReason = "escape" | "close-button" | "backdrop" | "navigation";

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel = "ยืนยัน",
  intent = "danger",
  pending = false,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  consequence?: string;
  confirmLabel?: string;
  intent?: "primary" | "danger";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return <Dialog open={open} title={title} description={consequence} busy={pending} onOpenChange={(next) => { if (!next) onCancel(); }}>
    {children}
    <div className="ui-dialog-actions"><button type="button" className="ui-button ui-button-ghost" onClick={onCancel} disabled={pending}>ยกเลิก</button><button type="button" className={`ui-button ui-button-${intent}`} onClick={onConfirm} disabled={pending} aria-busy={pending || undefined}>{pending ? "กำลังดำเนินการ…" : confirmLabel}</button></div>
  </Dialog>;
}

export function Dialog({
  open,
  title,
  description,
  children,
  onOpenChange,
  busy = false,
  beforeClose,
  initialFocusRef,
  returnFocusRef,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  beforeClose?: (reason: CloseReason) => boolean | Promise<boolean>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const openerRef = useRef<HTMLElement | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const closeRequestRef = useRef(false);
  const closeOperationRef = useRef(0);
  const mountedRef = useRef(true);
  const openRef = useRef(open);
  const busyRef = useRef(busy);
  useLayoutEffect(() => {
    openRef.current = open;
    busyRef.current = busy;
    closeOperationRef.current += 1;
  }, [open, busy]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      closeOperationRef.current += 1;
    };
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    if (open && !dialog.open) {
      openerRef.current = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);
      dialog.showModal();
      focusFrameRef.current = window.requestAnimationFrame(() => {
        focusFrameRef.current = null;
        if (dialog.open) (initialFocusRef?.current ?? dialog.querySelector<HTMLElement>("[data-dialog-close], button, input, select, textarea, a"))?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, returnFocusRef, initialFocusRef]);

  useEffect(() => () => {
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    (returnFocusRef?.current ?? openerRef.current)?.focus();
  }, [returnFocusRef]);

  async function requestClose(reason: CloseReason) {
    if (!mountedRef.current || !openRef.current || busyRef.current || closeRequestRef.current) return;
    closeRequestRef.current = true;
    const operation = ++closeOperationRef.current;
    try {
      if (beforeClose && !(await beforeClose(reason))) return;
      if (!mountedRef.current || !openRef.current || busyRef.current || closeOperationRef.current !== operation) return;
      onOpenChange(false);
    } catch {
      // A rejected close guard keeps the dialog open without leaking an unhandled rejection.
    } finally {
      closeRequestRef.current = false;
    }
  }

  return <dialog
    ref={dialogRef}
    className={["ui-dialog", className].filter(Boolean).join(" ")}
    aria-labelledby={titleId}
    aria-modal="true"
    aria-describedby={description ? descriptionId : undefined}
    onCancel={(event) => { event.preventDefault(); void requestClose("escape"); }}
    onClose={() => { if (open) onOpenChange(false); (returnFocusRef?.current ?? openerRef.current)?.focus(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const insideDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!insideDialog) void requestClose("backdrop");
    }}
  >
    <header className="ui-dialog-header">
      <div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div>
      <button type="button" className="ui-button ui-button-ghost" data-dialog-close onClick={() => void requestClose("close-button")} disabled={busy}>ปิดหน้าต่าง</button>
    </header>
    <div className="ui-dialog-body" aria-busy={busy || undefined}>{children}</div>
  </dialog>;
}
