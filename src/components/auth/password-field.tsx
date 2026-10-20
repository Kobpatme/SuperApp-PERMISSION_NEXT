"use client";
import { useId, useState, type Ref, type InputHTMLAttributes } from "react";
import { copy } from "@/lib/copy";
import { WorkspaceIcon } from "@/components/workspace-icon";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; inputRef?: Ref<HTMLInputElement>; error?: string };
export function PasswordField({ label, inputRef, error, ...input }: Props) {
  const id = useId(); const [visible, setVisible] = useState(false); const [caps, setCaps] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label>
    <div className="auth-password"><input {...input} id={id} ref={inputRef} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`} onKeyUp={event => setCaps(event.getModifierState("CapsLock"))} onKeyDown={event => setCaps(event.getModifierState("CapsLock"))}/>
      <button type="button" className="auth-visibility" aria-pressed={visible} aria-label={`${visible ? copy.auth.hidePassword : copy.auth.showPassword}: ${label}`} onClick={() => setVisible(value => !value)}>
        {[false,true].map(hidden => <WorkspaceIcon key={String(hidden)} name={hidden ? "eye-off" : "eye"} size={20} className={`auth-eye ${visible === hidden ? "is-visible" : ""}`}/>)}
      </button>
    </div><span id={`${id}-hint`} className="auth-field-hint" aria-live="polite">{error ? `! ${error}` : caps ? copy.auth.capsLock : ""}</span>
  </div>;
}
