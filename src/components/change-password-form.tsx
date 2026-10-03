"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/app/login/actions";
import { PasswordField } from "@/components/auth/password-field";
import { passwordCriteria, validatePassword } from "@/lib/password-policy";
import { copy } from "@/lib/copy";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState("");
  const criteria = passwordCriteria(password);
  const checks = [[criteria.length, copy.auth.checkLength], [criteria.letter, copy.auth.checkLetter], [criteria.number, copy.auth.checkNumber], [criteria.symbol, copy.auth.checkSymbol]] as const;
  return <form action={action} className="auth-form" noValidate aria-busy={pending} onSubmit={event => {
    const validation = validatePassword(password);
    const message = !validation.ok ? validation.message : password !== confirm ? copy.auth.passwordMismatch : "";
    setError(message); if (message || pending) event.preventDefault();
  }}>
    {(state.error || error) && !pending && <div className="auth-error" role="alert">! {state.error || error}</div>}
    <PasswordField label={copy.auth.newPassword} name="password" minLength={12} maxLength={256} autoComplete="new-password" required autoFocus value={password} onChange={event => setPassword(event.target.value)}/>
    <PasswordField label={copy.auth.confirmPassword} name="confirm" minLength={12} maxLength={256} autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} error={confirm && password !== confirm ? copy.auth.passwordMismatch : undefined}/>
    <div className="auth-hint"><strong>{copy.auth.passwordChecklist}</strong><ul aria-live="polite">{checks.map(([met, label]) => <li key={label} className={met ? "is-met" : ""}><span aria-hidden="true">{met ? "✓" : "○"}</span> {label}</li>)}</ul><span aria-live="polite">{confirm && password === confirm && copy.auth.passwordMatch}</span></div>
    <button className="button auth-submit-button" disabled={pending}>{pending && <span className="auth-spinner" aria-hidden="true"/>}{pending ? copy.auth.savingPassword : copy.auth.savePassword}<span aria-hidden="true">→</span></button>
  </form>;
}
