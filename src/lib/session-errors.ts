/** Infrastructure failure is not an invalid credential/session. Never fail open. */
export class SessionUnavailableError extends Error {
  constructor() { super("ไม่สามารถตรวจสอบการเข้าสู่ระบบได้ชั่วคราว กรุณาลองใหม่"); this.name = "SessionUnavailableError"; }
}
