"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return <form className="auth-form" action={action}>
    {state.error && <div className="auth-error" role="alert">{state.error}</div>}
    <label>อีเมล<input name="email" type="email" autoComplete="email" placeholder="name@company.com" required autoFocus /></label>
    <label>รหัสผ่าน<input name="password" type="password" autoComplete="current-password" placeholder="กรอกรหัสผ่าน" minLength={8} required /></label>
    <button className="button auth-submit-button" disabled={pending} type="submit">
      {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ Workspace"}
      {!pending && <span aria-hidden="true">→</span>}
    </button>
  </form>;
}
