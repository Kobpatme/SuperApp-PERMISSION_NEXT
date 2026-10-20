"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction } from "@/app/login/actions";
import { ChangePasswordFields, submitPasswordChange } from "./change-password-form-ux";
import { passwordCriteria } from "@/lib/password-policy";
import { copy } from "@/lib/copy";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state.error) passwordRef.current?.focus(); }, [state]);
  const criteria = passwordCriteria(password);
  const checks = [[criteria.length, copy.auth.checkLength], [criteria.letter, copy.auth.checkLetter], [criteria.number, copy.auth.checkNumber], [criteria.symbol, copy.auth.checkSymbol]] as const;
  return <form action={action} className="auth-form" noValidate aria-busy={pending} onSubmit={event => {
    submitPasswordChange(event, { password, confirm, pending, setErrors, focus: field => (field === "password" ? passwordRef : confirmRef).current?.focus() });
  }}>
    {state.error && !pending && <div className="auth-error" role="alert">! {state.error}</div>}
    <ChangePasswordFields password={password} confirm={confirm} errors={errors} passwordRef={passwordRef} confirmRef={confirmRef} onPasswordChange={value => { setPassword(value); setErrors({}); }} onConfirmChange={value => { setConfirm(value); setErrors(current => ({ ...current, confirm: undefined })); }}/>
    <div className="auth-hint"><strong>{copy.auth.passwordChecklist}</strong><ul aria-live="polite">{checks.map(([met, label]) => <li key={label} className={met ? "is-met" : ""}><span aria-hidden="true">{met ? "✓" : "○"}</span> {label}</li>)}</ul><span aria-live="polite">{confirm && password === confirm && copy.auth.passwordMatch}</span></div>
    <button className="button auth-submit-button" disabled={pending}>{pending && <span className="auth-spinner" aria-hidden="true"/>}{pending ? copy.auth.savingPassword : copy.auth.savePassword}<span aria-hidden="true">→</span></button>
  </form>;
}
