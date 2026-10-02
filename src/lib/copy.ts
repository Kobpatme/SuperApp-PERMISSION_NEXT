export const copy = {
  auth: {
    brandHeadline: "ทุกงานสำคัญ อยู่ในที่เดียว",
    brandDescription: "เข้าสู่ระบบครั้งเดียว แล้วใช้งานได้ทุกส่วนตามสิทธิ์ของคุณ",
    loginTitle: "ยินดีต้อนรับกลับมา",
    loginDescription: "กรอกอีเมลและรหัสผ่านเพื่อเริ่มงานได้เลย",
    email: "อีเมล", emailPlaceholder: "name@company.com",
    password: "รหัสผ่าน", passwordPlaceholder: "กรอกรหัสผ่านของคุณ",
    emailRequired: "กรุณากรอกอีเมล", emailInvalid: "รูปแบบอีเมลยังไม่ถูกต้อง เช่น name@company.com",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    login: "เข้าสู่ระบบ", pending: "กำลังตรวจสอบ…",
    genericError: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน",
    serviceError: (id: string) => `ตอนนี้เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง หากยังไม่ได้ โปรดแจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิง ${id}`,
    rateLimited: (seconds: number) => `ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารออีก ${Math.max(1, Math.ceil(seconds / 60))} นาทีแล้วลองใหม่`,
    expired: "เพื่อความปลอดภัย ระบบออกจากระบบให้อัตโนมัติ กรุณาเข้าสู่ระบบอีกครั้ง",
    signedOut: "ออกจากระบบเรียบร้อยแล้ว",
    capsLock: "Caps Lock เปิดอยู่", showPassword: "แสดงรหัสผ่าน", hidePassword: "ซ่อนรหัสผ่าน",
    help: "เข้าสู่ระบบไม่ได้ หรือลืมรหัสผ่าน?", contact: "ติดต่อผู้ดูแลระบบ",
    changeTitle: "ตั้งรหัสผ่านใหม่ของคุณ",
    changeDescription: "รหัสผ่านชั่วคราวใช้ได้แค่ครั้งแรก ตั้งรหัสผ่านใหม่ที่คุณจำได้ง่ายแต่คนอื่นเดายาก แล้วเริ่มใช้งานได้เลย",
    newPassword: "รหัสผ่านใหม่", confirmPassword: "ยืนยันรหัสผ่านใหม่",
    savePassword: "บันทึกและเข้าใช้งาน", savingPassword: "กำลังบันทึก…",
    passwordMismatch: "รหัสผ่านทั้งสองช่องยังไม่ตรงกัน", passwordMatch: "รหัสผ่านทั้งสองช่องตรงกันแล้ว",
    passwordChecklist: "รหัสผ่านที่แนะนำ", checkLength: "อย่างน้อย 12 ตัว", checkLetter: "มีตัวอักษรภาษาอังกฤษ", checkNumber: "มีตัวเลข", checkSymbol: "มีสัญลักษณ์",
  },
  feedback: {
    documentTimeout: "ค้นหาเอกสารนานกว่าปกติ ลองใหม่อีกครั้ง", createUnavailable: "ตอนนี้เพิ่มข้อมูลไม่ได้ ลองอีกครั้งได้เลย", themeLight: "เปลี่ยนเป็นโหมดสว่าง", themeDark: "เปลี่ยนเป็นโหมดมืด",
    loading: "กำลังโหลดข้อมูล…", workCreated: "เริ่มงานใหม่ได้เลย ทุกการเปลี่ยนแปลงมีประวัติให้ติดตาม", workCreateDescription: "เพิ่มงานของคุณ แล้วติดตามความคืบหน้าได้จากรายการงาน", workStatusDescription: "ดูความคืบหน้าและสถานะของแต่ละงานได้จากที่นี่",
    mapUnavailable: "ตอนนี้เปิดแผนที่ไม่ได้", mapFallback: "ค้นหาและดูข้อมูลอาคารจากรายการได้เลย", mapRetry: "ลองเปิดแผนที่อีกครั้ง หรือเลือกอาคารจากรายการ",
    readOnly: "ตอนนี้ดูรายการได้อย่างเดียว", documentLoading: "กำลังค้นหาเอกสาร…", documentTitle: "เอกสารอาคาร",
    unavailable: "ตอนนี้ยังดึงข้อมูลไม่ได้ ลองรีเฟรชอีกครั้ง หากยังไม่ได้โปรดแจ้งผู้ดูแลระบบ",
    partial: "ข้อมูลบางส่วนยังอัปเดตไม่ได้ ลองกด อัปเดตข้อมูล อีกครั้ง",
    denied: "บัญชีนี้ยังไม่ได้รับสิทธิ์สำหรับส่วนนี้ ขอสิทธิ์จากผู้ดูแลได้เลย",
    retry: "ลองอีกครั้ง", home: "กลับหน้าแรก", reference: "รหัสอ้างอิง",
    errorTitle: "ตอนนี้เปิดหน้านี้ไม่ได้", errorDescription: "ลองอีกครั้งได้เลย หากยังไม่ได้ โปรดแจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิงด้านล่าง",
    notFound: "ยังไม่พบหน้าที่คุณต้องการ", notFoundDescription: "ลิงก์นี้อาจเปลี่ยนไปแล้ว กลับหน้าแรกเพื่อเลือกงานที่ต้องการได้เลย",
    preparing: "ส่วนนี้กำลังเตรียมพร้อม", preparingDescription: "ระหว่างนี้เลือกงานอื่นจากเมนูได้เลย",
    documentsEmpty: "ยังไม่พบเอกสารของอาคารนี้", documentsUnavailable: "เปิดเอกสารไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง",
  },
} as const;

export function loginReason(reason?: string) {
  if (reason === "expired") return copy.auth.expired;
  if (reason === "signed-out") return copy.auth.signedOut;
  return undefined;
}
