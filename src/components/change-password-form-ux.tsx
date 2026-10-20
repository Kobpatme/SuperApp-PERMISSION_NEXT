import React, { type Ref } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { copy } from "@/lib/copy";
import { validatePassword } from "@/lib/password-policy";

type Errors = { password?: string; confirm?: string };
type Submission = { password: string; confirm: string; pending: boolean; setErrors(errors: Errors): void; focus(field: keyof Errors): void };
export function submitPasswordChange(event: { preventDefault(): void }, options: Submission) {
  if (options.pending) { event.preventDefault(); return; }
  const validation = validatePassword(options.password);
  const errors: Errors = {
    password: !validation.ok ? validation.message : undefined,
    confirm: options.password !== options.confirm ? copy.auth.passwordMismatch : undefined,
  };
  options.setErrors(errors);
  const first = errors.password ? "password" : errors.confirm ? "confirm" : undefined;
  if (first) { event.preventDefault(); options.focus(first); }
}

export function ChangePasswordFields({ password, confirm, errors, passwordRef, confirmRef, onPasswordChange, onConfirmChange }: {
  password: string; confirm: string; errors: Errors; passwordRef: Ref<HTMLInputElement>; confirmRef: Ref<HTMLInputElement>; onPasswordChange(value: string): void; onConfirmChange(value: string): void;
}) {
  return <><PasswordField label={copy.auth.newPassword} inputRef={passwordRef} name="password" minLength={12} maxLength={256} autoComplete="new-password" required autoFocus value={password} error={errors.password} onChange={event => onPasswordChange(event.target.value)}/><PasswordField label={copy.auth.confirmPassword} inputRef={confirmRef} name="confirm" minLength={12} maxLength={256} autoComplete="new-password" required value={confirm} onChange={event => onConfirmChange(event.target.value)} error={errors.confirm || (confirm && password !== confirm ? copy.auth.passwordMismatch : undefined)}/></>;
}
