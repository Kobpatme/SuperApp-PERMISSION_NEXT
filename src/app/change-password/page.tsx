import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getCurrentUser } from "@/lib/auth";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <main className="auth-page"><section className="auth-shell"><div className="auth-intro"><div className="auth-brand"><span className="brand-mark"/><span><strong>Permission Next</strong><small>Organization Identity</small></span></div><div className="auth-intro-copy"><span className="auth-kicker">SECURE FIRST SIGN-IN</span><h1>ตั้งรหัสผ่าน<br/>ของคุณเอง</h1><p>รหัสผ่านชั่วคราวใช้ได้สำหรับการเข้าสู่ระบบครั้งแรกเท่านั้น หลังเปลี่ยนแล้ว session เดิมทุกอุปกรณ์จะถูกยกเลิก</p></div></div><div className="auth-panel"><div className="auth-panel-inner"><span className="eyebrow">บัญชี {user.email}</span><h2>เปลี่ยนรหัสผ่าน</h2><p>สร้างรหัสผ่านใหม่ก่อนเข้าสู่พื้นที่ทำงาน</p><ChangePasswordForm/></div></div></section></main>;
}
