import Link from "next/link";

export function AccessDenied({ moduleName }: { moduleName: string }) {
  return <section className="access-denied" role="alert">
    <span className="access-denied-mark" aria-hidden="true">!</span>
    <div>
      <p className="eyebrow">สิทธิ์การใช้งาน</p>
      <h1>ไม่มีสิทธิ์เข้าใช้ {moduleName}</h1>
      <p>บัญชีของคุณยังไม่ได้รับบทบาทสำหรับโมดูลนี้ โปรดติดต่อผู้ดูแลระบบหากจำเป็นต้องใช้งาน</p>
      <Link className="primary" href="/">กลับไปพื้นที่ทำงาน</Link>
    </div>
  </section>;
}
