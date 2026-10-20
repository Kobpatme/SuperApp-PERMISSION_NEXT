export function acceptsNewCarBookings() {
  return process.env.CAR_BOOKING_ACCEPT_NEW_BOOKINGS !== "false";
}
export const carBookingPausedMessage = "ระบบหยุดรับการจองใหม่ชั่วคราว ยังสามารถคืนรถ ยกเลิก และบันทึกการเดินทางได้";
