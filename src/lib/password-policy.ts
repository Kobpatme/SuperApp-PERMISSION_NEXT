export type PasswordValidation = { ok: true } | { ok: false; message: string };

const commonPasswords = new Set([
  "password",
  "password123",
  "1234567890",
  "qwerty123",
  "welcome123",
  "admin123",
]);

export function validatePassword(password: string): PasswordValidation {
  if (password.length < 12) return { ok: false, message: "รหัสผ่านต้องมีอย่างน้อย 12 ตัว" };
  if (password.length > 256) return { ok: false, message: "รหัสผ่านยาวเกินไป" };
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return { ok: false, message: "รหัสผ่านต้องมีตัวอักษร ตัวเลข และสัญลักษณ์" };
  }
  if (commonPasswords.has(password.toLocaleLowerCase("en-US"))) return { ok: false, message: "โปรดเลือกรหัสผ่านที่คาดเดาได้ยากกว่านี้" };
  return { ok: true };
}

