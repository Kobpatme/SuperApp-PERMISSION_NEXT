import React from "react";

export function confirmAccountSecurityAction(event: { preventDefault(): void }, kind: "reset-password" | "revoke-sessions", user: { displayName: string | null; email: string }, confirm: (message: string) => boolean = message => window.confirm(message)) {
  const account = user.displayName ? `${user.displayName} (${user.email})` : user.email;
  const consequence = kind === "reset-password" ? "ผู้ใช้ต้องตั้งรหัสผ่านใหม่และทุกเซสชันจะถูกยกเลิก" : "ทุกอุปกรณ์จะถูกตัดการเชื่อมต่อ โดยไม่เปลี่ยนรหัสผ่าน";
  if (!confirm(`ยืนยัน${kind === "reset-password" ? "รีเซ็ตรหัสผ่าน" : "ยกเลิกทุกเซสชัน"}ของ ${account}? ${consequence}`)) event.preventDefault();
}


export function AdminSearchFeedback({ total, visible, onClear }: { total: number; visible: number; onClear(): void }) {
  if (visible) return null;
  return <div role="status"><p>{total ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}</p>{total > 0 && <button type="button" className="secondary-action" onClick={onClear}>ล้างคำค้นหา</button>}</div>;
}

export function ResetPasswordInput({ userId }: { userId: string }) {
  const id = `reset-password-${userId}`;
  return <><label htmlFor={id}>รหัสผ่านชั่วคราว</label><input id={id} aria-describedby={`${id}-hint`} name="password" type="password" minLength={12} autoComplete="new-password" required/><small id={`${id}-hint`}>อย่างน้อย 12 ตัวอักษร ผู้ใช้ต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบ</small></>;
}
