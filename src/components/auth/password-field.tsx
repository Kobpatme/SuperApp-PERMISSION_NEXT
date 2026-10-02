"use client";
import { useId, useState, type Ref, type InputHTMLAttributes } from "react";
import { copy } from "@/lib/copy";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; inputRef?: Ref<HTMLInputElement>; error?: string };
export function PasswordField({ label, inputRef, error, ...input }: Props) {
  const id = useId(); const [visible, setVisible] = useState(false); const [caps, setCaps] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label>
    <div className="auth-password"><input {...input} id={id} ref={inputRef} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`} onKeyUp={event => setCaps(event.getModifierState("CapsLock"))} onKeyDown={event => setCaps(event.getModifierState("CapsLock"))}/>
      <button type="button" className="auth-visibility" aria-pressed={visible} aria-label={`${visible ? copy.auth.hidePassword : copy.auth.showPassword}: ${label}`} onClick={() => setVisible(value => !value)}>
        <svg key={String(visible)} className="auth-eye" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg>
      </button>
    </div><span id={`${id}-hint`} className="auth-field-hint" aria-live="polite">{error ? `! ${error}` : caps ? copy.auth.capsLock : ""}</span>
  </div>;
}
