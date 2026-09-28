"use client";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <section className="queue-empty" role="alert"><h1>โหลดพื้นที่ทำงานไม่สำเร็จ</h1><p>กรุณาลองอีกครั้ง หากยังใช้งานไม่ได้ โปรดติดต่อผู้ดูแลระบบ</p><button type="button" className="primary" onClick={reset}>ลองอีกครั้ง</button></section>;
}
