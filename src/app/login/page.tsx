import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return <main className="auth-page">
    <section className="auth-shell">
      <div className="auth-intro">
        <div className="auth-brand"><span className="brand-mark" aria-hidden="true"/><span><strong>Permission Next</strong><small>Workspace</small></span></div>
        <div className="auth-intro-copy">
          <span className="auth-kicker">บัญชีเดียว · ทุกพื้นที่ทำงาน</span>
          <h1>ทุกงานสำคัญ<br/>อยู่ในที่เดียว</h1>
          <p>เข้าสู่ระบบเพียงครั้งเดียว เพื่อใช้งานทุกโมดูลตามสิทธิ์ของคุณอย่างสะดวกและปลอดภัย</p>
        </div>
        <div className="auth-module-list" aria-label="โมดูลในระบบ">
          <span><b>01</b> งานและ KPI</span>
          <span><b>02</b> อาคารและค่าใช้จ่าย</span>
          <span><b>03</b> เงินประกัน</span>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand"><span className="brand-mark" aria-hidden="true"/><strong>Permission Next</strong></div>
          <span className="eyebrow">เข้าสู่พื้นที่ทำงาน</span>
          <h2>ยินดีต้อนรับกลับมา</h2>
          <p>ใช้บัญชีกลางขององค์กรเพื่อดำเนินการต่อ</p>
          <LoginForm />
          <div className="auth-security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            <span>ระบบบัญชีภายในองค์กร · รหัสผ่าน Argon2id · สิทธิ์แบบ RBAC</span>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
