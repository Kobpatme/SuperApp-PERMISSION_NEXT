"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/login/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return <form action={action} className="auth-form">
    {state.error && <div className="auth-error" role="alert">{state.error}</div>}
    <label>รหัสผ่านใหม่<input name="password" type="password" minLength={12} autoComplete="new-password" required autoFocus/></label>
    <label>ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" minLength={12} autoComplete="new-password" required/></label>
    <div className="auth-dev-note"><strong>นโยบายรหัสผ่าน</strong><span>อย่างน้อย 12 ตัว และมีตัวอักษร ตัวเลข และสัญลักษณ์</span></div>
    <button className="button auth-submit-button" disabled={pending}>{pending ? "กำลังเปลี่ยน…" : "เปลี่ยนรหัสผ่านและเข้าใช้งาน"}<span aria-hidden="true">→</span></button>
  </form>;
}
