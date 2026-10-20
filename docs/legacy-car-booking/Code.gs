// Code.gs - ระบบยืม-คืนรถแผนก OSP (Optimized Version)
// UTF-8 Encoding for Thai Language Support
// ปรับปรุง: 2025-04-03

// ============================================
// GLOBAL CONFIG & SHEET REFERENCES
// ============================================
const CONFIG = {
  CACHE_TTL: 21600, // 6 ชั่วโมง
  LOCK_TIMEOUT: 30000, // 30 วินาที
  BOOKING_LOGS_SHEET: 'BookingLogs',
  BOOKINGS_OSP_SHEET: 'BookingsOSP',
  BOOKING_HEADERS: [
    'booking_id', 'employee_id', 'employee_name', 'car_plate',
    'destination', 'start_time', 'end_time', 'booking_status',
    'start_mileage', 'mileage_on_return', 'actual_return_time',
    'parking_floor', 'refueled', 'fuel_mileage', 'fuel_liters', 'fuel_amount'
  ],
  BOOKING_LOG_HEADERS: [
    'log_id', 'booking_id', 'log_time', 'log_type', 'location',
    'mileage', 'refueled', 'fuel_liters', 'fuel_amount', 'note',
    'gps_latitude', 'gps_longitude', 'gps_accuracy_meters',
    'created_by', 'created_at'
  ],
  BOOKINGS_OSP_HEADERS: [
    '_booking_id', 'ลำดับที่', 'วันที่ใช้รถ', 'เวลาเริ่มต้น',
    'เลขไมล์เริ่มต้น', 'วันที่จอดรถ', 'เวลาสิ้นสุด', 'เลขไมล์สิ้นสุด',
    'ระยะทางรวม (Km)', 'ศูนย์บริการ', 'ทะเบียนรถ', 'ชื่อผู้ใช้รถ',
    'Sap. อ้างอิง', 'รายละเอียดงาน / เหตุผลการใช้รถ', 'จุดจอดรถ',
    'เลขไมล์ที่เติมน้ำมัน', 'จำนวนลิตรที่เติมน้ำมัน', 'จำนวนเงินที่เติมน้ำมัน (บาท)',
    'logs_json'
  ]
};

const ss = SpreadsheetApp.getActiveSpreadsheet();

// Sheet references (lazy loading)
let _sheets = {};

function getSheets() {
  if (!_sheets.Employees) {
    _sheets.Employees = ss.getSheetByName('Employees');
    if (!_sheets.Employees) throw new Error("ไม่พบชีต 'Employees'");
  }
  if (!_sheets.Cars) {
    _sheets.Cars = ss.getSheetByName('Cars');
    if (!_sheets.Cars) throw new Error("ไม่พบชีต 'Cars'");
  }
  if (!_sheets.Bookings) {
    _sheets.Bookings = ss.getSheetByName('Bookings');
    if (!_sheets.Bookings) throw new Error("ไม่พบชีต 'Bookings'");
  }
  return _sheets;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * แปลง Date เป็น string แบบ dd/MM/yyyy พ.ศ.
 */
function formatDateThai(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

/**
 * Normalize employee ID (ลบ leading zeros)
 */
function normalizeEmployeeId(id) {
  if (id === null || id === undefined) return '';
  return id.toString().replace(/^'+/, '').replace(/^0+/, '').trim();
}

/**
 * สร้าง header index map
 */
function getHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    if (h) map[h.toString().trim()] = i;
  });
  return map;
}

/**
 * ดึงชีต BookingsLogs
 */
function getBookingLogsSheet() {
  let sheet = ss.getSheetByName(CONFIG.BOOKING_LOGS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.BOOKING_LOGS_SHEET);
    sheet.appendRow(CONFIG.BOOKING_LOG_HEADERS);
    sheet.getRange(1, 1, 1, CONFIG.BOOKING_LOG_HEADERS.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  }
  return sheet;
}

/**
 * ดึงชีต BookingsOSP
 */
function getBookingsOSPSheet() {
  let sheet = ss.getSheetByName(CONFIG.BOOKINGS_OSP_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.BOOKINGS_OSP_SHEET);
    sheet.appendRow(CONFIG.BOOKINGS_OSP_HEADERS);
    sheet.getRange(1, 1, 1, CONFIG.BOOKINGS_OSP_HEADERS.length).setFontWeight('bold');
    sheet.hideColumns(1);
  }
  return sheet;
}

/**
 * ตรวจสอบว่าคอลัมน์ครบหรือไม่ ถ้าไม่ครบให้เพิ่ม
 */
function ensureColumns(sheet, requiredHeaders) {
  if (!sheet) return;
  
  const lastCol = sheet.getLastColumn();
  const headers = lastCol > 0 
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] 
    : [];
  
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    let nextCol = headers.length + 1;
    missingHeaders.forEach(header => {
      sheet.getRange(1, nextCol).setValue(header);
      nextCol++;
    });
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  }
}

/**
 * Cache ข้อมูลชั่วคราว
 */
function getCachedData(key) {
  const cache = CacheService.getScriptCache();
  const data = cache.get(key);
  return data ? JSON.parse(data) : null;
}

function setCachedData(key, data, ttl = CONFIG.CACHE_TTL) {
  const cache = CacheService.getScriptCache();
  cache.put(key, JSON.stringify(data), ttl);
}

function invalidateCache(key) {
  const cache = CacheService.getScriptCache();
  cache.remove(key);
}

function createAuthToken(employeeId) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    'auth_token_' + token,
    normalizeEmployeeId(employeeId),
    CONFIG.CACHE_TTL
  );
  return token;
}

function resolveEmployeeIdFromAuth(authContext) {
  if (!authContext) {
    return null;
  }

  const token = typeof authContext === 'string'
    ? authContext
    : authContext.authToken || authContext.token;

  if (typeof authContext === 'string' && !authContext.includes('-')) {
    return authContext;
  }

  if (token) {
    const employeeId = CacheService.getScriptCache().get('auth_token_' + token);
    if (employeeId) return employeeId;
    return null;
  }

  if (typeof authContext === 'object') {
    return authContext.employeeId || authContext.employee_id || authContext.id || null;
  }

  return authContext;
}

// ============================================
// USER & EMPLOYEE FUNCTIONS
// ============================================

function getCurrentUser(authContext) {
  const employeeId = resolveEmployeeIdFromAuth(authContext);
  if (!employeeId) return null;
  return getEmployeeById(employeeId);
}

function getEmployeeById(employeeId) {
  const sheets = getSheets();
  const data = sheets.Employees.getDataRange().getValues();
  if (data.length <= 1) return null;
  
  const headerMap = getHeaderMap(data[0]);
  const normId = normalizeEmployeeId(employeeId);
  
  for (let i = 1; i < data.length; i++) {
    const rowId = normalizeEmployeeId(data[i][headerMap.id]);
    if (rowId === normId) {
      return {
        id: data[i][headerMap.id].toString().replace(/^'+/, ''),
        name: data[i][headerMap.name],
        role: data[i][headerMap.role] || 'user'
      };
    }
  }
  return null;
}

function login(employeeId) {
  try {
    const user = getEmployeeById(employeeId);
    if (user) {
      user.authToken = createAuthToken(user.id);
    }
    return user;
  } catch (e) {
    Logger.log('Login Error: ' + e.message);
    return null;
  }
}

function logout(authContext) {
  if (authContext) {
    const token = typeof authContext === 'string'
      ? authContext
      : authContext.authToken || authContext.token;
    if (token) CacheService.getScriptCache().remove('auth_token_' + token);
  }
  PropertiesService.getUserProperties().deleteProperty('employeeId');
}

function isUserAdmin(authContext) {
  const user = getCurrentUser(authContext);
  return user && user.role && user.role.toString().trim().toLowerCase() === 'admin';
}

// ============================================
// CAR FUNCTIONS
// ============================================

function getAllCars(authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Cars.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    const headerMap = getHeaderMap(data[0]);
    const cars = data.slice(1).map(row => ({
      id: row[headerMap.car_id],
      license_plate: row[headerMap.license_plate],
      parking_floor: row[headerMap.parking_floor],
      latest_mileage: row[headerMap.latest_mileage]
    }));
    
    return { success: true, data: cars };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function addCar(carData) {
  if (!isUserAdmin(carData)) {
    return { success: false, message: 'ไม่มีสิทธิ์เพิ่มรถยนต์' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Cars.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    // หา car_id ใหม่
    const existingIds = data.slice(1)
      .map(r => parseInt(r[headerMap.car_id]))
      .filter(n => !isNaN(n));
    const newCarId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    
    // เพิ่มแถวใหม่
    const newRow = [];
    newRow[headerMap.car_id] = newCarId;
    newRow[headerMap.license_plate] = carData.license_plate;
    newRow[headerMap.parking_floor] = carData.parking_floor;
    newRow[headerMap.latest_mileage] = carData.latest_mileage;
    
    // เติมค่าว่างในคอลัมน์ที่เหลือ
    const fullRow = new Array(data[0].length).fill('');
    Object.keys(newRow).forEach(idx => {
      fullRow[idx] = newRow[idx];
    });
    
    sheets.Cars.appendRow(fullRow);
    
    return { 
      success: true, 
      message: 'เพิ่มรถยนต์สำเร็จ', 
      data: { id: newCarId, ...carData } 
    };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function updateCar(carData) {
  if (!isUserAdmin(carData)) {
    return { success: false, message: 'ไม่มีสิทธิ์แก้ไขรถยนต์' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Cars.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerMap.car_id].toString() === carData.id.toString()) {
        // อัปเดตเฉพาะคอลัมน์ที่จำเป็น
        if (carData.license_plate !== undefined) {
          sheets.Cars.getRange(i + 1, headerMap.license_plate + 1).setValue(carData.license_plate);
        }
        if (carData.parking_floor !== undefined) {
          sheets.Cars.getRange(i + 1, headerMap.parking_floor + 1).setValue(carData.parking_floor);
        }
        if (carData.latest_mileage !== undefined) {
          sheets.Cars.getRange(i + 1, headerMap.latest_mileage + 1).setValue(carData.latest_mileage);
        }
        
        return { success: true, message: 'แก้ไขข้อมูลรถยนต์สำเร็จ' };
      }
    }
    
    return { success: false, message: 'ไม่พบรถยนต์ที่ต้องการแก้ไข' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function deleteCar(carId, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์ลบรถยนต์' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Cars.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerMap.car_id].toString() === carId.toString()) {
        sheets.Cars.deleteRow(i + 1);
        return { success: true, message: 'ลบรถยนต์สำเร็จ' };
      }
    }
    
    return { success: false, message: 'ไม่พบรถยนต์ที่ต้องการลบ' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function getCarByLicensePlate(licensePlate) {
  const sheets = getSheets();
  const data = sheets.Cars.getDataRange().getValues();
  if (data.length <= 1) return null;
  
  const headerMap = getHeaderMap(data[0]);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap.license_plate].toString() === licensePlate.toString()) {
      return {
        id: data[i][headerMap.car_id],
        license_plate: data[i][headerMap.license_plate],
        parking_floor: data[i][headerMap.parking_floor],
        latest_mileage: data[i][headerMap.latest_mileage]
      };
    }
  }
  return null;
}

// ============================================
// EMPLOYEE FUNCTIONS (Admin)
// ============================================

function getAllEmployees(authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Employees.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    const headerMap = getHeaderMap(data[0]);
    const employees = data.slice(1).map(row => ({
      id: row[headerMap.id].toString().replace(/^'+/, ''),
      name: row[headerMap.name],
      role: row[headerMap.role] || 'user'
    }));
    
    return { success: true, data: employees };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function addEmployee(employeeData) {
  if (!isUserAdmin(employeeData)) {
    return { success: false, message: 'ไม่มีสิทธิ์เพิ่มพนักงาน' };
  }
  
  try {
    const sheets = getSheets();
    const existingEmployee = getEmployeeById(employeeData.id);
    if (existingEmployee) {
      return { success: false, message: 'รหัสพนักงานนี้มีอยู่แล้วในระบบ' };
    }
    
    const data = sheets.Employees.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    const newRow = new Array(data[0].length).fill('');
    newRow[headerMap.id] = "'" + employeeData.id.toString(); // เก็บ leading zeros
    newRow[headerMap.name] = employeeData.name;
    newRow[headerMap.role] = employeeData.role || 'user';
    
    sheets.Employees.appendRow(newRow);
    
    return { success: true, message: 'เพิ่มพนักงานสำเร็จ' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function updateEmployeeDetails(employeeData) {
  if (!isUserAdmin(employeeData)) {
    return { success: false, message: 'ไม่มีสิทธิ์แก้ไขพนักงาน' };
  }
  
  try {
    const sheets = getSheets();
    const empData = sheets.Employees.getDataRange().getValues();
    const empHeaderMap = getHeaderMap(empData[0]);
    
    for (let i = 1; i < empData.length; i++) {
      if (normalizeEmployeeId(empData[i][empHeaderMap.id]) === normalizeEmployeeId(employeeData.id)) {
        // อัปเดตข้อมูลพนักงาน
        sheets.Employees.getRange(i + 1, empHeaderMap.name + 1).setValue(employeeData.name);
        sheets.Employees.getRange(i + 1, empHeaderMap.role + 1).setValue(employeeData.role);
        
        // อัปเดตชื่อใน Bookings sheet (ถ้ามี)
        updateEmployeeNameInBookings(employeeData.id, employeeData.name);
        
        return { success: true, message: 'แก้ไขข้อมูลพนักงานสำเร็จ' };
      }
    }
    
    return { success: false, message: 'ไม่พบพนักงานที่ต้องการแก้ไข' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function updateEmployeeNameInBookings(employeeId, newName) {
  try {
    const sheets = getSheets();
    const bookingData = sheets.Bookings.getDataRange().getValues();
    const bookingHeaderMap = getHeaderMap(bookingData[0]);
    
    if (bookingHeaderMap.employee_id === undefined || bookingHeaderMap.employee_name === undefined) {
      return;
    }
    
    const normId = normalizeEmployeeId(employeeId);
    const updates = [];
    
    for (let i = 1; i < bookingData.length; i++) {
      if (normalizeEmployeeId(bookingData[i][bookingHeaderMap.employee_id]) === normId) {
        updates.push({
          row: i + 1,
          col: bookingHeaderMap.employee_name + 1,
          value: newName
        });
      }
    }
    
    // อัปเดตแบบ batch
    if (updates.length > 0) {
      updates.forEach(update => {
        sheets.Bookings.getRange(update.row, update.col).setValue(update.value);
      });
    }
  } catch (e) {
    Logger.log('updateEmployeeNameInBookings Error: ' + e.message);
  }
}

function deleteEmployee(employeeId, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์ลบพนักงาน' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Employees.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeEmployeeId(data[i][headerMap.id]) === normalizeEmployeeId(employeeId)) {
        sheets.Employees.deleteRow(i + 1);
        return { success: true, message: 'ลบพนักงานสำเร็จ' };
      }
    }
    
    return { success: false, message: 'ไม่พบพนักงานที่ต้องการลบ' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

// ============================================
// BOOKING FUNCTIONS
// ============================================

function getAllBookings(authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลการจอง' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Bookings.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    const headerMap = getHeaderMap(data[0]);
    const bookings = data.slice(1).map(row => {
      const booking = {};
      Object.keys(headerMap).forEach(key => {
        const value = row[headerMap[key]];
        booking[key] = value instanceof Date ? value.toISOString() : value;
      });
      return booking;
    });
    
    return { success: true, data: bookings };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function cancelBookingByAdmin(bookingId, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์ยกเลิกการจอง' };
  }
  return cancelBooking(bookingId, authContext);
}

function cancelBooking(bookingId, authContext) {
  try {
    const currentUser = getCurrentUser(authContext);
    if (!currentUser) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' };
    }
    
    const sheets = getSheets();
    const data = sheets.Bookings.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    
    if (headerMap.booking_id === undefined || headerMap.booking_status === undefined) {
      return { success: false, message: 'ไม่พบคอลัมน์ที่จำเป็น' };
    }
    
    // หา booking row
    let bookingRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerMap.booking_id].toString() === bookingId.toString()) {
        bookingRowIndex = i + 1;
        break;
      }
    }
    
    if (bookingRowIndex === -1) {
      return { success: false, message: 'ไม่พบข้อมูลการจองที่จะยกเลิก' };
    }
    
    // ตรวจสอบสิทธิ์
    const bookingRow = data[bookingRowIndex - 1];
    const isOwner = canAccessBooking(currentUser, bookingRow, headerMap);
    
    if (!isOwner && currentUser.role !== 'admin') {
      return { success: false, message: 'ไม่มีสิทธิ์ยกเลิกรายการนี้' };
    }
    
    if (bookingRow[headerMap.booking_status] !== 'booked') {
      return { success: false, message: 'รายการนี้ไม่สามารถยกเลิกได้' };
    }
    
    // อัปเดตสถานะ
    sheets.Bookings.getRange(bookingRowIndex, headerMap.booking_status + 1).setValue('cancelled');
    
    // ลบจาก BookingsOSP
    removeBookingFromOSP(bookingId);
    
    // ลบ cache
    invalidateAllCaches();
    
    return { success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

/**
 * ตรวจสอบว่า user สามารถเข้าถึง booking นี้ได้หรือไม่
 */
function canAccessBooking(user, row, headerMap) {
  if (!user || !row) return false;
  
  const empIdIdx = headerMap.employee_id;
  const empNameIdx = headerMap.employee_name;
  
  if (empIdIdx === undefined || empNameIdx === undefined) return false;
  
  const bookingOwnerId = row[empIdIdx];
  const bookingOwnerName = row[empNameIdx];
  
  if (user.role && user.role.toString().trim().toLowerCase() === 'admin') {
    return true;
  }
  
  if (bookingOwnerId) {
    return normalizeEmployeeId(bookingOwnerId) === normalizeEmployeeId(user.id);
  }
  
  return bookingOwnerName === user.name;
}

/**
 * ตรวจสอบว่า booking ยัง active อยู่หรือไม่
 */
function isBookingActive(row, headerMap) {
  if (row[headerMap.booking_status] !== 'booked') return false;
  
  const actualReturn = headerMap.actual_return_time !== undefined 
    ? row[headerMap.actual_return_time] 
    : null;
  
  if (actualReturn instanceof Date && !isNaN(actualReturn)) return false;
  
  return true;
}

/**
 * ตรวจสอบว่า booking ซ้อนกับเวลาที่ระบุหรือไม่
 */
function checkCarConflict(carPlate, startTime, endTime, bookingData = null, headerMap = null, excludeBookingId = null) {
  // ใช้ข้อมูลที่ส่งมา หรืออ่านใหม่ถ้าไม่มี
  const sheets = getSheets();
  const data = bookingData || sheets.Bookings.getDataRange().getValues();
  if (data.length <= 1) return false;

  const hMap = headerMap || getHeaderMap(data[0]);
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // ข้าม booking ที่ต้องการ exclude
    if (excludeBookingId && row[hMap.booking_id].toString() === excludeBookingId.toString()) {
      continue;
    }

    // ข้าม booking ที่ยกเลิกแล้ว
    if (row[hMap.booking_status] === 'cancelled') continue;

    // ตรวจสอบเฉพาะรถคันเดียวกัน
    if (row[hMap.car_plate].toString() !== carPlate.toString()) continue;

    const existingStart = new Date(row[hMap.start_time]);
    const existingEnd = row[hMap.actual_return_time] instanceof Date && !isNaN(row[hMap.actual_return_time])
      ? new Date(row[hMap.actual_return_time])
      : new Date(row[hMap.end_time]);

    // ตรวจสอบเวลาซ้อนกัน
    if (newStart < existingEnd && newEnd > existingStart) {
      return true;
    }
  }

  return false;
}

/**
 * ตรวจสอบว่า employee มี booking ซ้อนหรือไม่
 */
function checkEmployeeConflict(employeeId, startTime, endTime, bookingData = null, headerMap = null, excludeBookingId = null) {
  // ใช้ข้อมูลที่ส่งมา หรืออ่านใหม่ถ้าไม่มี
  const sheets = getSheets();
  const data = bookingData || sheets.Bookings.getDataRange().getValues();
  if (data.length <= 1) return false;

  const hMap = headerMap || getHeaderMap(data[0]);
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);
  const normEmpId = normalizeEmployeeId(employeeId);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // ข้าม booking ที่ยกเลิกแล้ว
    if (row[hMap.booking_status] === 'cancelled') continue;

    // ข้าม booking ที่ต้องการ exclude
    if (excludeBookingId && row[hMap.booking_id].toString() === excludeBookingId.toString()) {
      continue;
    }

    // ตรวจสอบว่าเป็นพนักงานคนเดียวกัน
    if (normalizeEmployeeId(row[hMap.employee_id]) !== normEmpId) continue;

    const existingStart = new Date(row[hMap.start_time]);
    const existingEnd = row[hMap.actual_return_time] instanceof Date && !isNaN(row[hMap.actual_return_time])
      ? new Date(row[hMap.actual_return_time])
      : new Date(row[hMap.end_time]);

    // ตรวจสอบเวลาซ้อนกัน
    if (newStart < existingEnd && newEnd > existingStart) {
      return true;
    }
  }

  return false;
}

function bookCar(bookingInfos, authContext) {
  const lock = LockService.getScriptLock();

  try {
    // รอคิวสูงสุด 30 วินาที
    lock.waitLock(CONFIG.LOCK_TIMEOUT);

    const user = getCurrentUser(authContext || (bookingInfos && bookingInfos[0]));
    if (!user) {
      return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };
    }

    const sheets = getSheets();
    // อ่านข้อมูลเพียงครั้งเดียว
    const bookingData = sheets.Bookings.getDataRange().getValues();
    const headerMap = getHeaderMap(bookingData[0]);

    // ตรวจสอบคอลัมน์ที่จำเป็น
    const requiredCols = ['booking_id', 'employee_id', 'employee_name', 'car_plate',
                          'destination', 'start_time', 'end_time', 'booking_status',
                          'start_mileage'];

    for (const col of requiredCols) {
      if (headerMap[col] === undefined) {
        return { success: false, message: `ไม่พบคอลัมน์ ${col}` };
      }
    }

    // อ่านข้อมูลรถเพียงครั้งเดียว
    const carData = sheets.Cars.getDataRange().getValues();
    const carHeaderMap = getHeaderMap(carData[0]);

    // ตรวจสอบ conflict และเตรียมข้อมูล
    const rowsToAdd = [];
    const responseData = [];

    for (const bookingInfo of bookingInfos) {
      // ตรวจสอบ car conflict (ส่งข้อมูลเข้าไปแทนการอ่านใหม่)
      if (checkCarConflict(bookingInfo.car_plate, bookingInfo.start_time, bookingInfo.end_time, bookingData, headerMap)) {
        return {
          success: false,
          message: `รถทะเบียน ${bookingInfo.car_plate} ไม่ว่างในช่วงเวลาที่เลือก`
        };
      }

      // ตรวจสอบ employee conflict (ส่งข้อมูลเข้าไปแทนการอ่านใหม่)
      if (checkEmployeeConflict(user.id, bookingInfo.start_time, bookingInfo.end_time, bookingData, headerMap)) {
        return {
          success: false,
          message: 'คุณมีการจองรถในช่วงเวลานี้แล้ว ไม่สามารถจองซ้อนได้'
        };
      }

      // สร้าง booking ID ใหม่
      const bookingId = 'B' + Date.now() + Math.random().toString(36).substring(7);

      // ดึงข้อมูลรถจากที่อ่านไว้แล้ว
      let startMileage = 0;
      for (let i = 1; i < carData.length; i++) {
        if (carData[i][carHeaderMap.license_plate].toString() === bookingInfo.car_plate.toString()) {
          startMileage = carData[i][carHeaderMap.latest_mileage] || 0;
          break;
        }
      }

      // สร้างแถวใหม่
      const newRow = new Array(bookingData[0].length).fill('');
      newRow[headerMap.booking_id] = bookingId;
      newRow[headerMap.employee_id] = "'" + user.id.toString(); // เก็บ leading zeros
      newRow[headerMap.employee_name] = user.name;
      newRow[headerMap.car_plate] = bookingInfo.car_plate;
      newRow[headerMap.destination] = bookingInfo.destination;
      newRow[headerMap.start_time] = new Date(bookingInfo.start_time);
      newRow[headerMap.end_time] = new Date(bookingInfo.end_time);
      newRow[headerMap.booking_status] = 'booked';
      newRow[headerMap.start_mileage] = startMileage;

      rowsToAdd.push(newRow);
      responseData.push({
        booking_id: bookingId,
        employee_name: user.name,
        car_plate: bookingInfo.car_plate,
        start_time: bookingInfo.start_time,
        end_time: bookingInfo.end_time,
        destination: bookingInfo.destination
      });
    }
    
    // เขียนข้อมูลทั้งหมดในครั้งเดียว
    if (rowsToAdd.length > 0) {
      const lastRow = sheets.Bookings.getLastRow();
      sheets.Bookings.getRange(lastRow + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);

      // ตั้ง format employee_id เป็น text
      if (headerMap.employee_id !== undefined) {
        sheets.Bookings.getRange(lastRow + 1, headerMap.employee_id + 1, rowsToAdd.length, 1)
          .setNumberFormat('@');
      }
    }
    
    // ลบ cache
    invalidateAllCaches();
    
    return { 
      success: true, 
      message: 'จองรถสำเร็จ!', 
      type: 'booking', 
      data: responseData 
    };
  } catch (e) {
    Logger.log('bookCar Error: ' + e.message);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ตรวจสอบว่ามี previous booking ที่ยังไม่คืนหรือไม่
 * ถ้ามี ให้ return ข้อมูลคนที่ค้างอยู่
 */
function checkPreviousBookingNotReturned(carPlate, currentBookingId) {
  try {
    const sheets = getSheets();
    const bookingData = sheets.Bookings.getDataRange().getValues();
    if (bookingData.length <= 1) return null;

    const headerMap = getHeaderMap(bookingData[0]);
    const currentBooking = getBookingById(currentBookingId);
    if (!currentBooking) return null;

    const currentStartTime = currentBooking.row[headerMap.start_time];

    // หา booking ของรถคันเดียวกัน ที่เริ่มก่อน current booking และยังไม่คืน
    for (let i = 1; i < bookingData.length; i++) {
      const row = bookingData[i];
      const bookingId = row[headerMap.booking_id];

      // ข้าม booking ปัจจุบัน
      if (bookingId.toString() === currentBookingId.toString()) continue;

      // ตรวจสอบรถคันเดียวกัน
      if (row[headerMap.car_plate].toString() !== carPlate.toString()) continue;

      // ตรวจสอบสถานะ booked (ยังไม่คืน)
      if (row[headerMap.booking_status] !== 'booked') continue;

      const startTime = row[headerMap.start_time];
      if (!(startTime instanceof Date) || isNaN(startTime)) continue;

      // ถ้าเริ่มก่อน current booking และยังไม่คืน = ค้างอยู่
      if (startTime < currentStartTime) {
        // ตรวจสอบว่ายังไม่คืน (ไม่มี actual_return_time)
        const actualReturn = headerMap.actual_return_time !== undefined
          ? row[headerMap.actual_return_time]
          : null;

        if (!actualReturn || !(actualReturn instanceof Date) || isNaN(actualReturn)) {
          return {
            booking_id: bookingId,
            employee_name: row[headerMap.employee_name] || '',
            employee_id: headerMap.employee_id !== undefined ? row[headerMap.employee_id] : '',
            start_time: startTime,
            destination: headerMap.destination !== undefined ? row[headerMap.destination] : ''
          };
        }
      }
    }

    return null;
  } catch (e) {
    Logger.log('checkPreviousBookingNotReturned Error: ' + e.message);
    return null;
  }
}

function returnCar(returnInfo) {
  try {
    const currentUser = getCurrentUser(returnInfo);
    if (!currentUser) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' };
    }

    const sheets = getSheets();
    const bookingData = sheets.Bookings.getDataRange().getValues();
    const bookingHeaderMap = getHeaderMap(bookingData[0]);

    // หา booking
    let bookingRowIndex = -1;
    for (let i = 1; i < bookingData.length; i++) {
      if (bookingData[i][bookingHeaderMap.booking_id].toString() === returnInfo.booking_id.toString()) {
        bookingRowIndex = i + 1;
        break;
      }
    }

    if (bookingRowIndex === -1) {
      return { success: false, message: 'ไม่พบข้อมูลการจอง' };
    }

    const bookingRow = bookingData[bookingRowIndex - 1];

    // ตรวจสอบสิทธิ์
    if (!canAccessBooking(currentUser, bookingRow, bookingHeaderMap) && currentUser.role !== 'admin') {
      return { success: false, message: 'ไม่มีสิทธิ์คืนรถรายการนี้' };
    }

    // ตรวจสอบสถานะ
    if (bookingRow[bookingHeaderMap.booking_status] !== 'booked') {
      return { success: false, message: 'รายการนี้ไม่ได้อยู่ในสถานะที่คืนรถได้' };
    }

    // 🔒 ตรวจสอบว่ามี previous booking ที่ยังไม่คืนหรือไม่
    const previousNotReturned = checkPreviousBookingNotReturned(
      returnInfo.car_plate,
      returnInfo.booking_id
    );

    if (previousNotReturned) {
      const prevName = previousNotReturned.employee_name || 'ไม่ระบุ';
      return {
        success: false,
        message: `ไม่สามารถคืนรถได้ เนื่องจากผู้ใช้งานก่อนหน้า (${prevName}) ยังไม่ได้คืนรถ กรุณาติดต่อให้ผู้ใช้งานก่อนหน้าคืนรถก่อน`
      };
    }

    // ตรวจสอบเลขไมล์
    const mileage = parseFloat(returnInfo.mileage);
    if (isNaN(mileage)) {
      return { success: false, message: 'เลขไมล์ต้องเป็นตัวเลขเท่านั้น' };
    }

    const car = getCarByLicensePlate(returnInfo.car_plate);
    if (!car) {
      return { success: false, message: 'ไม่พบข้อมูลรถยนต์' };
    }

    const currentMileage = parseFloat(car.latest_mileage);
    if (mileage <= currentMileage) {
      return {
        success: false,
        message: `เลขไมล์ต้องมากกว่าเลขไมล์ล่าสุด (${currentMileage})`
      };
    }

    // เตรียมข้อมูลอัปเดต (เขียนทีเดียว)
    const rowRange = sheets.Bookings.getRange(bookingRowIndex, 1, 1, bookingData[0].length);
    const rowValues = rowRange.getValues()[0];

    rowValues[bookingHeaderMap.booking_status] = 'completed';
    rowValues[bookingHeaderMap.actual_return_time] = new Date(returnInfo.return_time);
    rowValues[bookingHeaderMap.mileage_on_return] = mileage;
    rowValues[bookingHeaderMap.parking_floor] = returnInfo.parking_floor;
    rowValues[bookingHeaderMap.refueled] = returnInfo.refueled || false;

    if (returnInfo.refueled) {
      if (bookingHeaderMap.fuel_mileage !== undefined) {
        rowValues[bookingHeaderMap.fuel_mileage] = parseFloat(returnInfo.fuel_mileage) || '';
      }
      if (bookingHeaderMap.fuel_liters !== undefined) {
        rowValues[bookingHeaderMap.fuel_liters] = parseFloat(returnInfo.fuel_liters) || '';
      }
      if (bookingHeaderMap.fuel_amount !== undefined) {
        rowValues[bookingHeaderMap.fuel_amount] = parseFloat(returnInfo.fuel_amount) || '';
      }
    } else {
      if (bookingHeaderMap.fuel_mileage !== undefined) rowValues[bookingHeaderMap.fuel_mileage] = '';
      if (bookingHeaderMap.fuel_liters !== undefined) rowValues[bookingHeaderMap.fuel_liters] = '';
      if (bookingHeaderMap.fuel_amount !== undefined) rowValues[bookingHeaderMap.fuel_amount] = '';
    }

    // เขียนข้อมูล booking
    rowRange.setValues([rowValues]);

    // อัปเดตข้อมูลรถ
    updateCarMileageAndFloor(returnInfo.car_plate, returnInfo.parking_floor, mileage);

    // Sync ไปยัง BookingsOSP
    syncCompletedBookingToOSP(returnInfo.booking_id);

    // ลบ cache
    invalidateAllCaches();

    return {
      success: true,
      message: 'คืนรถเรียบร้อยแล้ว',
      type: 'return',
      data: [returnInfo]
    };
  } catch (e) {
    Logger.log('returnCar Error: ' + e.message);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

/**
 * อัปเดตเลขไมล์และที่จอดรถของรถ (batch update)
 */
function updateCarMileageAndFloor(carPlate, parkingFloor, mileage) {
  try {
    const sheets = getSheets();
    const carData = sheets.Cars.getDataRange().getValues();
    const carHeaderMap = getHeaderMap(carData[0]);
    
    for (let i = 1; i < carData.length; i++) {
      if (carData[i][carHeaderMap.license_plate].toString() === carPlate.toString()) {
        const updates = [];
        
        if (parkingFloor !== undefined && carHeaderMap.parking_floor !== undefined) {
          updates.push({ row: i + 1, col: carHeaderMap.parking_floor + 1, value: parkingFloor });
        }
        
        if (mileage !== undefined && carHeaderMap.latest_mileage !== undefined) {
          updates.push({ row: i + 1, col: carHeaderMap.latest_mileage + 1, value: mileage });
        }
        
        // อัปเดตทีละคอลัมน์ (GAS不支持 batch update แบบไม่เป็น contiguous range)
        updates.forEach(update => {
          sheets.Cars.getRange(update.row, update.col).setValue(update.value);
        });
        
        break;
      }
    }
  } catch (e) {
    Logger.log('updateCarMileageAndFloor Error: ' + e.message);
  }
}

function getInitialData(employeeId, authContext) {
  try {
    // ตรวจสอบ cache ก่อน (cache 1 นาที)
    const currentUser = getCurrentUser(authContext || employeeId);
    
    if (!currentUser) {
      return { 
        cars: [], 
        bookings: [], 
        openBookings: [],
        activeBookings: [], 
        error: 'ไม่พบข้อมูลพนักงาน' 
      };
    }

    const cacheKey = 'initial_data_' + currentUser.id;
    let cached = null;
    try {
      cached = getCachedData(cacheKey);
    } catch (e) {
      Logger.log('Cache read error: ' + e.message);
      // ไม่ใช้ cache ถ้ามีปัญหา
    }
    
    if (cached) {
      Logger.log('Cache hit for: ' + cacheKey);
      return cached;
    }

    const sheets = getSheets();
    // currentUser was resolved from the active auth token above.
    
    if (!currentUser) {
      return { 
        cars: [], 
        bookings: [], 
        openBookings: [],
        activeBookings: [], 
        error: 'ไม่พบข้อมูลพนักงาน' 
      };
    }
    
    // อ่านข้อมูลทั้งหมดเพียงครั้งเดียว (Optimized)
    const carData = sheets.Cars.getDataRange().getValues();
    const bookingData = sheets.Bookings.getDataRange().getValues();
    
    // ประมวลผลข้อมูลรถ
    let cars = [];
    if (carData.length > 1) {
      const carHeaderMap = getHeaderMap(carData[0]);
      
      // สร้าง map ของ booking ทั้งหมดสำหรับแต่ละรถ
      const bookingsByCar = {};
      
      for (let i = 1; i < bookingData.length; i++) {
        const row = bookingData[i];
        if (row.length < 2) continue;
        
        const tempHeaderMap = getHeaderMap(bookingData[0]);
        if (tempHeaderMap.car_plate === undefined || tempHeaderMap.employee_name === undefined) continue;
        
        const carPlate = row[tempHeaderMap.car_plate];
        const status = row[tempHeaderMap.booking_status];
        
        // ข้าม booking ที่ยกเลิก
        if (status === 'cancelled') continue;
        
        const empName = row[tempHeaderMap.employee_name];
        const startTime = row[tempHeaderMap.start_time];
        const actualReturn = tempHeaderMap.actual_return_time !== undefined ? row[tempHeaderMap.actual_return_time] : null;
        const mileageOnReturn = tempHeaderMap.mileage_on_return !== undefined ? row[tempHeaderMap.mileage_on_return] : null;
        
        if (carPlate && startTime instanceof Date && !isNaN(startTime)) {
          if (!bookingsByCar[carPlate]) {
            bookingsByCar[carPlate] = [];
          }
          
          bookingsByCar[carPlate].push({
            employee_name: empName,
            status: status,
            start_time: startTime,
            actual_return: actualReturn instanceof Date && !isNaN(actualReturn) ? actualReturn : null,
            mileage_on_return: mileageOnReturn
          });
        }
      }
      
      // เรียง booking ของแต่ละรถตามเวลาเริ่ม (เก่าไปใหม่)
      Object.keys(bookingsByCar).forEach(carPlate => {
        bookingsByCar[carPlate].sort((a, b) => a.start_time - b.start_time);
      });
      
      // สร้างข้อมูลรถพร้อม last_user
      cars = carData.slice(1).map(row => {
        const carPlate = row[carHeaderMap.license_plate];
        const carBookings = bookingsByCar[carPlate] || [];

        let lastUser = 'ยังไม่มีข้อมูล';
        let carLatestMileage = row[carHeaderMap.latest_mileage] || 0;
        const now = new Date();

        if (carBookings.length > 0) {
          // หา booking ปัจจุบัน (booked, ยังไม่ได้คืน, และเวลาเริ่มไปแล้ว)
          const currentBookingIndex = carBookings.findIndex(b =>
            b.status === 'booked' && !b.actual_return && new Date(b.start_time) <= now
          );

          if (currentBookingIndex > 0) {
            // มีคนใช้อยู่ตอนนี้ ให้แสดงคนที่ใช้ก่อนหน้า (ก่อน currentBookingIndex)
            // หา booking ที่คืนแล้วล่าสุดก่อน current booking
            for (let i = currentBookingIndex - 1; i >= 0; i--) {
              const prevBooking = carBookings[i];
              if (prevBooking.status === 'completed' && prevBooking.actual_return) {
                lastUser = prevBooking.employee_name || 'ไม่ระบุ';

                // อัปเดตเลขไมล์จากคืนล่าสุด
                if (prevBooking.mileage_on_return) {
                  const returnMileage = parseFloat(prevBooking.mileage_on_return);
                  if (!isNaN(returnMileage) && returnMileage > carLatestMileage) {
                    carLatestMileage = returnMileage;
                  }
                }
                break;
              }
            }

            // ถ้าไม่มี booking ที่คืนแล้ว ให้แสดง 'กำลังใช้งาน'
            if (lastUser === 'ยังไม่มีข้อมูล') {
              lastUser = 'ยังไม่เคยมีผู้ใช้งาน';
            }
          } else if (carBookings.length > 0) {
            // ไม่มีคนใช้อยู่ตอนนี้ ให้แสดงคนที่ใช้ล่าสุดที่คืนแล้ว
            for (let i = carBookings.length - 1; i >= 0; i--) {
              const booking = carBookings[i];
              if (booking.status === 'completed' && booking.actual_return) {
                lastUser = booking.employee_name || 'ไม่ระบุ';
                
                // อัปเดตเลขไมล์
                if (booking.mileage_on_return) {
                  const returnMileage = parseFloat(booking.mileage_on_return);
                  if (!isNaN(returnMileage) && returnMileage > carLatestMileage) {
                    carLatestMileage = returnMileage;
                  }
                }
                break;
              }
            }
            
            // ถ้าไม่มี booking ที่คืนเลย
            if (lastUser === 'ยังไม่มีข้อมูล') {
              const firstBooking = carBookings[0];
              if (firstBooking.status === 'booked') {
                lastUser = 'กำลังใช้งานครั้งแรก';
              } else {
                lastUser = 'ยังไม่เคยมีผู้ใช้งาน';
              }
            }
          }
        }
        
        return {
          id: row[carHeaderMap.car_id],
          license_plate: carPlate,
          parking_floor: row[carHeaderMap.parking_floor],
          latest_mileage: carLatestMileage,
          last_user: lastUser
        };
      });
    }
    
    // ประมวลผลข้อมูล booking - ส่งเฉพาะของผู้ใช้และ active bookings
    let bookings = [];
    let openBookings = [];
    let activeBookings = [];

    if (bookingData.length > 1) {
      const bookingHeaderMap = getHeaderMap(bookingData[0]);

      const requiredCols = ['booking_id', 'employee_id', 'employee_name', 'car_plate',
                            'start_time', 'end_time', 'booking_status', 'actual_return_time'];

      for (const col of requiredCols) {
        if (bookingHeaderMap[col] === undefined) {
          Logger.log(`Warning: Missing column ${col}`);
        }
      }

      const now = new Date();

      for (let i = 1; i < bookingData.length; i++) {
        const row = bookingData[i];

        // ข้าม booking ที่ยกเลิก
        if (row[bookingHeaderMap.booking_status] === 'cancelled') continue;

        const startDate = row[bookingHeaderMap.start_time];
        const endDate = row[bookingHeaderMap.end_time];
        const actualReturnDate = bookingHeaderMap.actual_return_time !== undefined
          ? row[bookingHeaderMap.actual_return_time]
          : null;

        if (!(startDate instanceof Date) || isNaN(startDate) ||
            !(endDate instanceof Date) || isNaN(endDate)) {
          continue;
        }

        const isSameEmployee = normalizeEmployeeId(
          bookingHeaderMap.employee_id !== undefined ? row[bookingHeaderMap.employee_id].toString().replace(/^'+/, '') : ''
        ) === normalizeEmployeeId(currentUser.id);

        const booking = {
          booking_id: row[bookingHeaderMap.booking_id],
          employee_id: bookingHeaderMap.employee_id !== undefined
            ? row[bookingHeaderMap.employee_id].toString().replace(/^'+/, '')
            : '',
          employee_name: row[bookingHeaderMap.employee_name],
          car_plate: row[bookingHeaderMap.car_plate],
          destination: bookingHeaderMap.destination !== undefined
            ? row[bookingHeaderMap.destination]
            : '',
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          booking_status: row[bookingHeaderMap.booking_status],
          actual_return_time: actualReturnDate instanceof Date && !isNaN(actualReturnDate)
            ? actualReturnDate.toISOString()
            : null
        };

        // สำหรับ user ธรรมดา: ส่งเฉพาะ booking ของตัวเอง
        // สำหรับ admin: ส่ง booking ทั้งหมด
        bookings.push(booking);

        // ตรวจสอบว่าเป็น active booking ของ user ปัจจุบัน
        if (booking.booking_status === 'booked' && isSameEmployee) {
          const actualReturn = booking.actual_return_time
            ? new Date(booking.actual_return_time)
            : null;

          if (!actualReturn) {
            openBookings.push(booking);

            if (startDate <= now) {
              activeBookings.push(booking);
            }
          }
        }
      }
    }
    
    // เรียง active bookings ตามเวลาเริ่ม
    openBookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    activeBookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const result = {
      cars: cars,
      bookings: bookings,
      openBookings: openBookings,
      activeBookings: activeBookings,
      currentUserRole: currentUser.role
    };

    // เก็บ cache 1 นาที (120 วินาที) - ใช้ try-catch ป้องกันข้อผิดพลาด
    try {
      const jsonString = JSON.stringify(result);
      // ตรวจสอบขนาดข้อมูล (ต้องไม่เกิน 100KB)
      if (jsonString.length < 100000) {
        setCachedData(cacheKey, result, 60);
        Logger.log('Cached data for: ' + cacheKey + ' (size: ' + Math.round(jsonString.length / 1024) + 'KB)');
      } else {
        Logger.log('Data too large to cache: ' + Math.round(jsonString.length / 1024) + 'KB');
      }
    } catch (e) {
      Logger.log('Cache write error: ' + e.message);
      // ไม่เป็นไรถ้า cache ไม่สำเร็จ
    }

    return result;
  } catch (e) {
    Logger.log('getInitialData Error: ' + e.message + '\n' + e.stack);
    return { 
      cars: [], 
      bookings: [], 
      openBookings: [],
      activeBookings: [], 
      error: e.message 
    };
  }
}

function invalidateAllCaches() {
  // ลบ cache ทั้งหมด
  const cache = CacheService.getScriptCache();
  cache.removeAll(['initial_data', 'cars_data', 'bookings_data']);
}

// ============================================
// BOOKING LOGS FUNCTIONS
// ============================================

/**
 * แปลงแถวของชีต BookingLogs เป็น object (ใช้ร่วมกันระหว่างการ sync รายรายการและการ rebuild ทั้งชีต)
 */
function mapBookingLogRow_(row, headerMap) {
  return {
    log_id: row[headerMap.log_id],
    booking_id: row[headerMap.booking_id],
    log_time: row[headerMap.log_time] instanceof Date 
      ? row[headerMap.log_time].toISOString() 
      : row[headerMap.log_time],
    log_type: row[headerMap.log_type] || 'other',
    location: row[headerMap.location] || '',
    mileage: row[headerMap.mileage] || '',
    refueled: row[headerMap.refueled] === true || row[headerMap.refueled] === 'TRUE',
    fuel_liters: row[headerMap.fuel_liters] || '',
    fuel_amount: row[headerMap.fuel_amount] || '',
    note: row[headerMap.note] || '',
    gps_latitude: headerMap.gps_latitude !== undefined 
      ? row[headerMap.gps_latitude] || '' 
      : '',
    gps_longitude: headerMap.gps_longitude !== undefined 
      ? row[headerMap.gps_longitude] || '' 
      : '',
    gps_accuracy_meters: headerMap.gps_accuracy_meters !== undefined 
      ? row[headerMap.gps_accuracy_meters] || '' 
      : '',
    created_by: row[headerMap.created_by] || '',
    created_at: row[headerMap.created_at] instanceof Date 
      ? row[headerMap.created_at].toISOString() 
      : row[headerMap.created_at]
  };
}

function getBookingLogsByBookingId(bookingId) {
  try {
    const sheet = getBookingLogsSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headerMap = getHeaderMap(data[0]);
    
    return data.slice(1)
      .filter(row => row[headerMap.booking_id].toString() === bookingId.toString())
      .map(row => mapBookingLogRow_(row, headerMap))
      .sort((a, b) => new Date(a.log_time) - new Date(b.log_time));
  } catch (e) {
    Logger.log('getBookingLogsByBookingId Error: ' + e.message);
    return [];
  }
}

function getBookingLogs(bookingId, authContext) {
  try {
    const currentUser = getCurrentUser(authContext);
    if (!currentUser) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' };
    }
    
    const bookingRecord = getBookingById(bookingId);
    if (!bookingRecord) {
      return { success: false, message: 'ไม่พบรายการจอง' };
    }
    
    // ตรวจสอบสิทธิ์
    if (!canAccessBooking(currentUser, bookingRecord.row, bookingRecord.headerMap)) {
      return { success: false, message: 'ไม่มีสิทธิ์ดูข้อมูลระหว่างทางของรายการนี้' };
    }
    
    return { 
      success: true, 
      data: getBookingLogsByBookingId(bookingId) 
    };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function addBookingLog(logData) {
  try {
    Logger.log('=== addBookingLog Start ===');
    Logger.log('Received logData: ' + JSON.stringify(logData));
    
    const currentUser = getCurrentUser(logData);
    if (!currentUser) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' };
    }
    
    const bookingRecord = getBookingById(logData.booking_id);
    if (!bookingRecord) {
      return { success: false, message: 'ไม่พบรายการจอง' };
    }
    
    // ตรวจสอบสิทธิ์
    if (!canAccessBooking(currentUser, bookingRecord.row, bookingRecord.headerMap)) {
      return { success: false, message: 'ไม่มีสิทธิ์บันทึกข้อมูลระหว่างทางสำหรับรายการนี้' };
    }
    
    // ตรวจสอบสถานะ
    if (bookingRecord.row[bookingRecord.headerMap.booking_status] !== 'booked') {
      return { success: false, message: 'บันทึกระหว่างทางได้เฉพาะรายการที่กำลังใช้งานอยู่' };
    }
    
    // Validate ข้อมูล
    const logTime = new Date(logData.log_time);
    if (isNaN(logTime)) {
      return { success: false, message: 'วันเวลาไม่ถูกต้อง' };
    }
    
    if (!logData.location || !logData.location.trim()) {
      return { success: false, message: 'กรุณาระบุสถานที่' };
    }
    
    const mileage = parseFloat(logData.mileage);
    if (isNaN(mileage)) {
      return { success: false, message: 'กรุณาระบุเลขไมล์เป็นตัวเลข' };
    }
    
    const existingLogs = getBookingLogsByBookingId(logData.booking_id);
    
    // Validate เลขไมล์
    const startMileage = parseFloat(bookingRecord.row[bookingRecord.headerMap.start_mileage]);
    if (!isNaN(startMileage) && mileage < startMileage) {
      return { success: false, message: `เลขไมล์ต้องไม่น้อยกว่าเลขไมล์เริ่มต้น (${startMileage})` };
    }
    
    // Validate การเติมน้ำมัน
    const isFuel = logData.log_type === 'fuel' || logData.refueled === true;
    if (isFuel && (!logData.fuel_liters || !logData.fuel_amount)) {
      return { success: false, message: 'กรุณาระบุจำนวนลิตรและจำนวนเงินสำหรับการเติมน้ำมัน' };
    }
    
    // สร้าง log ID
    const logId = 'L' + Date.now() + Math.random().toString(36).substring(2, 7);
    
    // เตรียมข้อมูล
    const sheet = getBookingLogsSheet();
    const headerMap = getHeaderMap(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
    
    const newRow = new Array(sheet.getLastColumn()).fill('');
    if (headerMap.log_id !== undefined) newRow[headerMap.log_id] = logId;
    if (headerMap.booking_id !== undefined) newRow[headerMap.booking_id] = logData.booking_id;
    if (headerMap.log_time !== undefined) newRow[headerMap.log_time] = logTime;
    if (headerMap.log_type !== undefined) newRow[headerMap.log_type] = logData.log_type || 'other';
    if (headerMap.location !== undefined) newRow[headerMap.location] = logData.location.trim();
    if (headerMap.mileage !== undefined) newRow[headerMap.mileage] = mileage;
    if (headerMap.refueled !== undefined) newRow[headerMap.refueled] = isFuel;
    if (headerMap.fuel_liters !== undefined) {
      newRow[headerMap.fuel_liters] = isFuel ? (parseFloat(logData.fuel_liters) || '') : '';
    }
    if (headerMap.fuel_amount !== undefined) {
      newRow[headerMap.fuel_amount] = isFuel ? (parseFloat(logData.fuel_amount) || '') : '';
    }
    if (headerMap.note !== undefined) newRow[headerMap.note] = (logData.note || '').trim();
    if (headerMap.gps_latitude !== undefined) {
      const gpsLat = logData.gps_latitude;
      Logger.log('GPS Latitude received: ' + gpsLat);
      newRow[headerMap.gps_latitude] = (gpsLat !== null && gpsLat !== undefined && gpsLat !== '') 
        ? parseFloat(gpsLat) 
        : '';
    }
    if (headerMap.gps_longitude !== undefined) {
      const gpsLng = logData.gps_longitude;
      Logger.log('GPS Longitude received: ' + gpsLng);
      newRow[headerMap.gps_longitude] = (gpsLng !== null && gpsLng !== undefined && gpsLng !== '') 
        ? parseFloat(gpsLng) 
        : '';
    }
    if (headerMap.gps_accuracy_meters !== undefined) {
      const gpsAcc = logData.gps_accuracy_meters;
      newRow[headerMap.gps_accuracy_meters] = (gpsAcc !== null && gpsAcc !== undefined && gpsAcc !== '') 
        ? parseFloat(gpsAcc) 
        : '';
    }
    if (headerMap.created_by !== undefined) newRow[headerMap.created_by] = currentUser.name;
    if (headerMap.created_at !== undefined) newRow[headerMap.created_at] = new Date();
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'บันทึกข้อมูลระหว่างทางเรียบร้อยแล้ว' };
  } catch (e) {
    Logger.log('addBookingLog Error: ' + e.message);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function getBookingGpsLogsForAdmin(bookingId, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' };
  }
  
  try {
    const bookingRecord = getBookingById(bookingId);
    if (!bookingRecord) {
      return { success: false, message: 'ไม่พบรายการจอง' };
    }
    
    const logs = getBookingLogsByBookingId(bookingId)
      .filter(log => log.gps_latitude && log.gps_longitude)
      .map(log => ({
        log_id: log.log_id,
        log_type: getTripLogTypeLabel(log.log_type, log.refueled),
        log_time: log.log_time,
        location: log.location || '',
        mileage: log.mileage || '',
        gps_latitude: log.gps_latitude,
        gps_longitude: log.gps_longitude,
        gps_accuracy_meters: log.gps_accuracy_meters || ''
      }));
    
    return {
      success: true,
      data: {
        booking_id: bookingId,
        employee_name: bookingRecord.row[bookingRecord.headerMap.employee_name] || '',
        car_plate: bookingRecord.row[bookingRecord.headerMap.car_plate] || '',
        destination: bookingRecord.row[bookingRecord.headerMap.destination] || '',
        logs: logs
      }
    };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function getTripLogTypeLabel(type, refueled) {
  if (type === 'fuel' || refueled) return 'เติมน้ำมัน';
  if (type === 'overnight_stop') return 'จอดพัก';
  if (type === 'checkpoint') return 'จุดแวะ';
  return 'บันทึกระหว่างทาง';
}

// ============================================
// BOOKINGS OSP SYNC FUNCTIONS
// ============================================

function getBookingById(bookingId) {
  try {
    const sheets = getSheets();
    const data = sheets.Bookings.getDataRange().getValues();
    if (data.length <= 1) return null;
    
    const headerMap = getHeaderMap(data[0]);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerMap.booking_id].toString() === bookingId.toString()) {
        return {
          row: data[i],
          rowIndex: i + 1,
          headers: data[0],
          headerMap: headerMap
        };
      }
    }
    
    return null;
  } catch (e) {
    Logger.log('getBookingById Error: ' + e.message);
    return null;
  }
}

function syncCompletedBookingToOSP(bookingId) {
  try {
    Logger.log('syncCompletedBookingToOSP: เริ่ม sync สำหรับ booking ' + bookingId);

    const bookingRecord = getBookingById(bookingId);
    if (!bookingRecord) {
      Logger.log('syncCompletedBookingToOSP: ไม่พบ booking ' + bookingId);
      return;
    }

    const { row, headerMap } = bookingRecord;

    // ตรวจสอบสถานะ
    const statusIdx = headerMap.booking_status;
    if (statusIdx === undefined) {
      Logger.log('syncCompletedBookingToOSP: ไม่พบคอลัมน์ booking_status');
      return;
    }

    const status = row[statusIdx] ? row[statusIdx].toString().trim().toLowerCase() : '';
    if (status !== 'completed') {
      Logger.log('syncCompletedBookingToOSP: booking ยังไม่ completed (status: ' + status + ')');
      return;
    }

    // ลบข้อมูลเก่า
    removeBookingFromOSP(bookingId);

    // ดึง logs
    const logs = getBookingLogsByBookingId(bookingId);

    // สร้างแถวเดียว (รวม summary + logs เป็น JSON)
    const summaryRow = buildOSPSummaryRow(row, headerMap, logs);
    getBookingsOSPSheet().appendRow(summaryRow);

    Logger.log('syncCompletedBookingToOSP: สำเร็จ สำหรับ booking ' + bookingId);
  } catch (e) {
    Logger.log('syncCompletedBookingToOSP Error: ' + e.message + '\n' + e.stack);
  }
}

function buildOSPSummaryRow(bookingRow, headerMap, logs, ctx) {
  // ctx (ไม่บังคับ) = { headers, rowNumber } ใช้ตอน rebuild ทั้งชีต เพื่อไม่ต้องอ่านชีตซ้ำทุกแถว
  const sheet = ctx ? null : getBookingsOSPSheet();
  const headers = ctx ? ctx.headers : sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const ospHeaderMap = getHeaderMap(headers);

  const startDate = bookingRow[headerMap.start_time] instanceof Date
    ? bookingRow[headerMap.start_time]
    : new Date(bookingRow[headerMap.start_time]);

  const returnDate = headerMap.actual_return_time !== undefined && bookingRow[headerMap.actual_return_time] instanceof Date
    ? bookingRow[headerMap.actual_return_time]
    : null;

  const startMileage = parseFloat(bookingRow[headerMap.start_mileage]) || 0;
  const endMileage = headerMap.mileage_on_return !== undefined
    ? parseFloat(bookingRow[headerMap.mileage_on_return]) || 0
    : 0;

  const distance = endMileage && startMileage ? endMileage - startMileage : '';

  // นับจำนวนครั้งที่เติมน้ำมัน และรวมยอด
  let fuelEventsCount = 0;
  let fuelTotalLiters = 0;
  let fuelTotalAmount = 0;
  let lastFuelMileage = '';
  let lastFuelLiters = '';
  let lastFuelAmount = '';

  if (logs && logs.length > 0) {
    logs.forEach(log => {
      if (log.log_type === 'fuel' || log.refueled) {
        fuelEventsCount++;
        const liters = parseFloat(log.fuel_liters) || 0;
        const amount = parseFloat(log.fuel_amount) || 0;
        fuelTotalLiters += liters;
        fuelTotalAmount += amount;
        lastFuelMileage = log.mileage || '';
        lastFuelLiters = log.fuel_liters || '';
        lastFuelAmount = log.fuel_amount || '';
      }
    });
  }

  // รวมข้อมูลเติมน้ำมันที่กรอกตอนคืนรถ (ชีต Bookings) เข้ากับที่บันทึกระหว่างทาง (BookingLogs)
  const bookingRefueled = headerMap.refueled !== undefined &&
    (bookingRow[headerMap.refueled] === true || String(bookingRow[headerMap.refueled]).toUpperCase() === 'TRUE');
  if (bookingRefueled) {
    const bLiters = headerMap.fuel_liters !== undefined ? parseFloat(bookingRow[headerMap.fuel_liters]) || 0 : 0;
    const bAmount = headerMap.fuel_amount !== undefined ? parseFloat(bookingRow[headerMap.fuel_amount]) || 0 : 0;
    if (bLiters > 0 || bAmount > 0) {
      fuelEventsCount++;
      fuelTotalLiters += bLiters;
      fuelTotalAmount += bAmount;
    }
  }

  const values = new Array(headers.length).fill('');

  // Map ข้อมูลหลัก
  if (ospHeaderMap['_booking_id'] !== undefined) values[ospHeaderMap['_booking_id']] = bookingRow[headerMap.booking_id] || '';
  if (ospHeaderMap['ลำดับที่'] !== undefined) values[ospHeaderMap['ลำดับที่']] = ctx ? ctx.rowNumber : sheet.getLastRow();
  if (ospHeaderMap['วันที่ใช้รถ'] !== undefined) values[ospHeaderMap['วันที่ใช้รถ']] = formatDateThai(startDate);
  if (ospHeaderMap['เวลาเริ่มต้น'] !== undefined) {
    values[ospHeaderMap['เวลาเริ่มต้น']] = startDate instanceof Date && !isNaN(startDate)
      ? Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'HH:mm')
      : '';
  }
  if (ospHeaderMap['เลขไมล์เริ่มต้น'] !== undefined) values[ospHeaderMap['เลขไมล์เริ่มต้น']] = startMileage || '';
  if (ospHeaderMap['วันที่จอดรถ'] !== undefined) values[ospHeaderMap['วันที่จอดรถ']] = returnDate ? formatDateThai(returnDate) : '';
  if (ospHeaderMap['เวลาสิ้นสุด'] !== undefined && returnDate) {
    values[ospHeaderMap['เวลาสิ้นสุด']] = returnDate instanceof Date && !isNaN(returnDate)
      ? Utilities.formatDate(returnDate, Session.getScriptTimeZone(), 'HH:mm')
      : '';
  }
  if (ospHeaderMap['เลขไมล์สิ้นสุด'] !== undefined) values[ospHeaderMap['เลขไมล์สิ้นสุด']] = endMileage || '';
  if (ospHeaderMap['ระยะทางรวม (Km)'] !== undefined) values[ospHeaderMap['ระยะทางรวม (Km)']] = distance;
  if (ospHeaderMap['ศูนย์บริการ'] !== undefined) values[ospHeaderMap['ศูนย์บริการ']] = 'OSP';
  if (ospHeaderMap['ทะเบียนรถ'] !== undefined) values[ospHeaderMap['ทะเบียนรถ']] = bookingRow[headerMap.car_plate] || '';
  if (ospHeaderMap['ชื่อผู้ใช้รถ'] !== undefined) values[ospHeaderMap['ชื่อผู้ใช้รถ']] = bookingRow[headerMap.employee_name] || '';
  if (ospHeaderMap['Sap. อ้างอิง'] !== undefined) values[ospHeaderMap['Sap. อ้างอิง']] = 'ไม่มี SAP';
  if (ospHeaderMap['รายละเอียดงาน / เหตุผลการใช้รถ'] !== undefined) {
    const destination = headerMap.destination !== undefined ? bookingRow[headerMap.destination] : '';
    
    // สร้างข้อความจาก logs
    let logsText = '';
    if (logs && logs.length > 0) {
      const logLines = logs.map(log => {
        const logDate = log.log_time ? new Date(log.log_time) : null;
        const dateStr = logDate ? formatDateThai(logDate) : '-';
        const timeStr = logDate ? Utilities.formatDate(logDate, Session.getScriptTimeZone(), 'HH:mm') : '';
        const dateTimeStr = `${dateStr} ${timeStr}`.trim();
        
        const typeLabel = getTripLogTypeLabel(log.log_type, log.refueled);
        const location = log.location || '-';
        const mileage = log.mileage ? ` | ไมล์ ${log.mileage}` : '';
        const note = log.note ? ` | ${log.note}` : '';
        
        if (log.log_type === 'fuel' || log.refueled) {
          const fuelLiters = log.fuel_liters ? ` | ${log.fuel_liters} ลิตร` : '';
          const fuelAmount = log.fuel_amount ? ` | ${log.fuel_amount} บาท` : '';
          return `${typeLabel} : ${dateTimeStr} | ${location}${mileage}${fuelLiters}${fuelAmount}${note}`;
        } else {
          return `${typeLabel} : ${dateTimeStr} | ${location}${mileage}${note}`;
        }
      });
      
      if (destination) {
        logsText = `${destination}\n\n${logLines.join('\n')}`;
      } else {
        logsText = logLines.join('\n');
      }
    } else {
      logsText = destination;
    }
    
    values[ospHeaderMap['รายละเอียดงาน / เหตุผลการใช้รถ']] = logsText;
  }
  if (ospHeaderMap['จุดจอดรถ'] !== undefined) values[ospHeaderMap['จุดจอดรถ']] = headerMap.parking_floor !== undefined ? bookingRow[headerMap.parking_floor] || '' : '';
  
  // ข้อมูลการเติมน้ำมัน (รวมจาก logs ทุกครั้ง เพื่อให้ได้ค่าที่ถูกต้อง)
  if (ospHeaderMap['เลขไมล์ที่เติมน้ำมัน'] !== undefined) {
    values[ospHeaderMap['เลขไมล์ที่เติมน้ำมัน']] = headerMap.fuel_mileage !== undefined && bookingRow[headerMap.fuel_mileage]
      ? bookingRow[headerMap.fuel_mileage]
      : lastFuelMileage;
  }
  if (ospHeaderMap['จำนวนลิตรที่เติมน้ำมัน'] !== undefined) {
    // รวมจำนวนลิตรจาก logs ทุกครั้ง
    values[ospHeaderMap['จำนวนลิตรที่เติมน้ำมัน']] = fuelTotalLiters > 0 ? fuelTotalLiters : '';
  }
  if (ospHeaderMap['จำนวนเงินที่เติมน้ำมัน (บาท)'] !== undefined) {
    // รวมจำนวนเงินจาก logs ทุกครั้ง (แก้ปัญหากรณีเติมน้ำมันหลายครั้ง)
    values[ospHeaderMap['จำนวนเงินที่เติมน้ำมัน (บาท)']] = fuelTotalAmount > 0 ? fuelTotalAmount : '';
  }

  // เก็บ logs เป็น JSON ในคอลัมน์เดียว
  if (ospHeaderMap['logs_json'] !== undefined) {
    if (logs && logs.length > 0) {
      const logsData = logs.map(log => ({
        time: log.log_time,
        type: getTripLogTypeLabel(log.log_type, log.refueled),
        location: log.location || '',
        mileage: log.mileage || '',
        fuel_liters: log.fuel_liters || '',
        fuel_amount: log.fuel_amount || '',
        note: log.note || '',
        gps: (log.gps_latitude && log.gps_longitude) ? {
          lat: log.gps_latitude,
          lng: log.gps_longitude,
          accuracy: log.gps_accuracy_meters || ''
        } : null
      }));
      values[ospHeaderMap['logs_json']] = JSON.stringify(logsData);
    } else {
      values[ospHeaderMap['logs_json']] = '';
    }
  }

  return values;
}

// ฟังก์ชัน buildOSPLogRow ไม่ใช้แล้ว - เก็บไว้เพื่อความเข้ากันได้
function buildOSPLogRow(bookingRow, headerMap, rowNumber, log) {
  const sheet = getBookingsOSPSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const ospHeaderMap = getHeaderMap(headers);
  
  const logDate = log.log_time ? new Date(log.log_time) : null;
  const isFuel = log.log_type === 'fuel' || log.refueled;
  
  const values = new Array(headers.length).fill('');
  
  if (ospHeaderMap['_booking_id'] !== undefined) values[ospHeaderMap['_booking_id']] = bookingRow[headerMap.booking_id] || '';
  if (ospHeaderMap['ลำดับที่'] !== undefined) values[ospHeaderMap['ลำดับที่']] = rowNumber;
  if (ospHeaderMap['ศูนย์บริการ'] !== undefined) values[ospHeaderMap['ศูนย์บริการ']] = 'OSP';
  if (ospHeaderMap['ทะเบียนรถ'] !== undefined) values[ospHeaderMap['ทะเบียนรถ']] = bookingRow[headerMap.car_plate] || '';
  if (ospHeaderMap['ชื่อผู้ใช้รถ'] !== undefined) values[ospHeaderMap['ชื่อผู้ใช้รถ']] = bookingRow[headerMap.employee_name] || '';
  if (ospHeaderMap['Sap. อ้างอิง'] !== undefined) values[ospHeaderMap['Sap. อ้างอิง']] = 'ไม่มี SAP';
  
  if (ospHeaderMap['วันที่ใช้รถ'] !== undefined) {
    values[ospHeaderMap['วันที่ใช้รถ']] = logDate ? formatDateThai(logDate) : '';
  }
  if (ospHeaderMap['เวลาเริ่มต้น'] !== undefined && logDate) {
    values[ospHeaderMap['เวลาเริ่มต้น']] = Utilities.formatDate(logDate, Session.getScriptTimeZone(), 'HH:mm');
  }
  if (ospHeaderMap['เลขไมล์เริ่มต้น'] !== undefined) values[ospHeaderMap['เลขไมล์เริ่มต้น']] = log.mileage || '';
  
  if (ospHeaderMap['รายละเอียดงาน / เหตุผลการใช้รถ'] !== undefined) {
    // ใส่เฉพาะประเภทและสถานที่ ไม่ต้องรายละเอียด panjang
    const typeLabel = getTripLogTypeLabel(log.log_type, log.refueled);
    values[ospHeaderMap['รายละเอียดงาน / เหตุผลการใช้รถ']] = typeLabel;
  }
  if (ospHeaderMap['จุดจอดรถ'] !== undefined) values[ospHeaderMap['จุดจอดรถ']] = log.location || '';

  if (isFuel) {
    if (ospHeaderMap['เลขไมล์ที่เติมน้ำมัน'] !== undefined) values[ospHeaderMap['เลขไมล์ที่เติมน้ำมัน']] = log.mileage || '';
    if (ospHeaderMap['จำนวนลิตรที่เติมน้ำมัน'] !== undefined) values[ospHeaderMap['จำนวนลิตรที่เติมน้ำมัน']] = log.fuel_liters || '';
    if (ospHeaderMap['จำนวนเงินที่เติมน้ำมัน (บาท)'] !== undefined) values[ospHeaderMap['จำนวนเงินที่เติมน้ำมัน (บาท)']] = log.fuel_amount || '';
  }

  // ไม่ใส่ trip_log_summary ในแถว log
  if (ospHeaderMap['_row_type'] !== undefined) values[ospHeaderMap['_row_type']] = 'log';
  if (ospHeaderMap['log_id'] !== undefined) values[ospHeaderMap['log_id']] = log.log_id || '';
  if (ospHeaderMap['event_type'] !== undefined) values[ospHeaderMap['event_type']] = getTripLogTypeLabel(log.log_type, log.refueled);
  
  return values;
}

// ฟังก์ชันนี้ไม่ใช้แล้ว - เก็บไว้เพื่อความเข้ากันได้
function buildTripLogDetail(log) {
  const label = getTripLogTypeLabel(log.log_type, log.refueled);
  const parts = [`${label}: ${log.location || '-'}`];

  if (log.mileage) {
    parts.push(`ไมล์ ${log.mileage}`);
  }

  if (log.log_type === 'fuel' || log.refueled) {
    parts.push(`${log.fuel_liters || 0} ลิตร`);
    parts.push(`${log.fuel_amount || 0} บาท`);
  }

  if (log.note) {
    parts.push(log.note);
  }

  return parts.join(' | ');
}

// ฟังก์ชันนี้ไม่ใช้แล้ว - เก็บไว้เพื่อความเข้ากันได้
function summarizeLogsForOSP(logs) {
  if (!logs || logs.length === 0) return '';

  return logs.map(log => {
    const logDate = log.log_time ? new Date(log.log_time) : null;
    const dateStr = logDate ? formatDateThai(logDate) : '-';
    const timeStr = logDate ? Utilities.formatDate(logDate, Session.getScriptTimeZone(), 'HH:mm') : '';

    if (log.log_type === 'fuel' || log.refueled) {
      return `${dateStr} ${timeStr} | เติมน้ำมัน | ${log.location || '-'} | ไมล์ ${log.mileage || 0} | ${log.fuel_liters || 0} ลิตร | ${log.fuel_amount || 0} บาท`;
    }

    const typeLabel = getTripLogTypeLabel(log.log_type, log.refueled);
    return `${dateStr} ${timeStr} | ${typeLabel} | ${log.location || '-'} | ไมล์ ${log.mileage || 0}`;
  }).join(' || ');
}

function removeBookingFromOSP(bookingId) {
  try {
    const sheet = getBookingsOSPSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const bookingIdIdx = headers.indexOf('_booking_id');
    if (bookingIdIdx === -1) return;
    
    // ลบจากล่างขึ้นบนเพื่อไม่ให้ row เปลี่ยน
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][bookingIdIdx] && data[i][bookingIdIdx].toString() === bookingId.toString()) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) {
    Logger.log('removeBookingFromOSP Error: ' + e.message);
  }
}

// ============================================
// DOGET - WEB APP ENTRY POINT
// ============================================

function doGet() {
  // Clear user session on each page load to force login
  PropertiesService.getUserProperties().deleteProperty('employeeId');
  
  const cache = CacheService.getScriptCache();
  const cacheKey = 'columns_initialized_v2';

  if (!cache.get(cacheKey)) {
    try {
      const sheets = getSheets();

      // ตรวจสอบคอลัมน์ที่จำเป็น
      ensureColumns(sheets.Bookings, CONFIG.BOOKING_HEADERS);
      ensureColumns(getBookingLogsSheet(), CONFIG.BOOKING_LOG_HEADERS);
      ensureColumns(getBookingsOSPSheet(), CONFIG.BOOKINGS_OSP_HEADERS);

      cache.put(cacheKey, 'true', CONFIG.CACHE_TTL);
      Logger.log('Columns initialized successfully');
    } catch (e) {
      Logger.log('Column initialization error: ' + e.message);
    }
  }
  
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ระบบยืม-คืนรถแผนก OSP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function getDashboardDataFromOSP(month, year, filterType, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' };
  }

  try {
    const sheets = getSheets();
    const data = sheets.Bookings.getDataRange().getValues();

    if (data.length <= 1) {
      return { success: true, data: buildDashboardResponseFromOSP([], month, year, filterType) };
    }

    const headerMap = getHeaderMap(data[0]);
    const filteredData = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = headerMap.booking_status !== undefined ? row[headerMap.booking_status] : '';
      if (status === 'cancelled') continue;

      let startDate = headerMap.start_time !== undefined ? row[headerMap.start_time] : null;
      if (startDate && !(startDate instanceof Date)) startDate = new Date(startDate);
      if (!(startDate instanceof Date) || isNaN(startDate)) continue;

      if (filterType === 'month' && month && year) {
        const targetMonth = parseInt(month, 10);
        const targetYearBE = parseInt(year, 10);
        const bookingMonth = startDate.getMonth() + 1;
        const bookingYearBE = startDate.getFullYear() + 543;

        if (bookingMonth !== targetMonth || bookingYearBE !== targetYearBE) {
          continue;
        }
      }

      filteredData.push(row);
    }

    return { success: true, data: buildDashboardResponseFromOSP(filteredData, month, year, filterType) };
  } catch (e) {
    Logger.log('getDashboardDataFromOSP Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

function buildDashboardResponseFromOSP(bookings, month, year, filterType) {
  const sheets = getSheets();
  const headerRow = sheets.Bookings.getDataRange().getValues()[0] || [];

  if (!bookings || !Array.isArray(bookings)) {
    Logger.log('buildDashboardResponseFromOSP: bookings is undefined or not array, using empty array');
    bookings = [];
  }

  const headerMap = getHeaderMap(headerRow);
  Logger.log('buildDashboardResponseFromOSP: processing ' + bookings.length + ' bookings');

  let totalBookings = bookings.length;
  let completed = 0;
  let active = 0;
  let upcoming = 0;
  let totalDistance = 0;
  let totalFuelAmount = 0;
  let totalFuelLiters = 0;
  const now = new Date();

  const carMap = {};
  const userMap = {};
  const allData = [];

  bookings
    .slice()
    .sort((a, b) => {
      const aStart = headerMap.start_time !== undefined ? a[headerMap.start_time] : null;
      const bStart = headerMap.start_time !== undefined ? b[headerMap.start_time] : null;
      const aDate = aStart instanceof Date ? aStart : new Date(aStart);
      const bDate = bStart instanceof Date ? bStart : new Date(bStart);
      const aTime = isNaN(aDate) ? Number.POSITIVE_INFINITY : aDate.getTime();
      const bTime = isNaN(bDate) ? Number.POSITIVE_INFINITY : bDate.getTime();
      return aTime - bTime;
    })
    .forEach((row, index) => {
    let startDate = headerMap.start_time !== undefined ? row[headerMap.start_time] : null;
    if (startDate && !(startDate instanceof Date)) startDate = new Date(startDate);

    const bookingStatus = headerMap.booking_status !== undefined ? row[headerMap.booking_status] : '';
    const isCompleted = bookingStatus === 'completed';
    const isBooked = bookingStatus === 'booked';
    const hasStarted = startDate instanceof Date && !isNaN(startDate) && startDate <= now;
    const isActiveNow = isBooked && hasStarted;
    const isUpcoming = isBooked && !hasStarted;

    if (isCompleted) completed++;
    else if (isActiveNow) active++;
    else if (isUpcoming) upcoming++;

    const carPlate = headerMap.car_plate !== undefined ? row[headerMap.car_plate] || '' : '';
    const employeeName = headerMap.employee_name !== undefined ? row[headerMap.employee_name] || '' : '';
    const startMileage = headerMap.start_mileage !== undefined ? parseFloat(row[headerMap.start_mileage]) || 0 : 0;
    const endMileage = headerMap.mileage_on_return !== undefined ? parseFloat(row[headerMap.mileage_on_return]) || 0 : 0;
    const distance = isCompleted && endMileage >= startMileage ? endMileage - startMileage : 0;
    const fuelAmount = headerMap.fuel_amount !== undefined ? parseFloat(row[headerMap.fuel_amount]) || 0 : 0;
    const fuelLiters = headerMap.fuel_liters !== undefined ? parseFloat(row[headerMap.fuel_liters]) || 0 : 0;

    if (isCompleted) {
      totalDistance += distance;
      totalFuelAmount += fuelAmount;
      totalFuelLiters += fuelLiters;
    }

    if (!carMap[carPlate]) carMap[carPlate] = { usage_count: 0, total_distance: 0, total_fuel: 0 };
    carMap[carPlate].usage_count++;
    carMap[carPlate].total_distance += distance;
    carMap[carPlate].total_fuel += fuelAmount;

    if (!userMap[employeeName]) userMap[employeeName] = { booking_count: 0 };
    userMap[employeeName].booking_count++;

    allData.push({
      sequence: index + 1,
      start_date: startDate instanceof Date && !isNaN(startDate) ? formatDateThai(startDate) : '-',
      car_plate: carPlate,
      employee_name: employeeName,
      distance: Math.round(distance),
      fuel_amount: Math.round(fuelAmount),
      is_completed: isCompleted,
      status_type: isCompleted ? 'completed' : (isActiveNow ? 'active' : 'upcoming'),
      status_label: isCompleted ? 'คืนแล้ว' : (isActiveNow ? 'กำลังใช้งาน' : 'จองล่วงหน้า')
    });
    });

  const carStats = Object.keys(carMap).map(plate => ({
    car_plate: plate,
    ...carMap[plate]
  })).sort((a, b) => b.usage_count - a.usage_count);

  const topUsers = Object.keys(userMap)
    .map(name => ({ employee_name: name, ...userMap[name] }))
    .sort((a, b) => b.booking_count - a.booking_count)
    .slice(0, 5);

  return {
    total_bookings: totalBookings,
    completed: completed,
    active: active,
    total_distance: Math.round(totalDistance),
    total_fuel_amount: Math.round(totalFuelAmount),
    total_fuel_liters: Math.round(totalFuelLiters * 10) / 10,
    upcoming: upcoming,
    car_stats: carStats,
    top_users: topUsers,
    all_data: allData
  };
}

// ============================================
// REPORT FUNCTIONS
// ============================================

function downloadBookingsByMonth(month, year, authContext) {
  if (!isUserAdmin(authContext)) {
    return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงรายงาน' };
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.Bookings.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, message: 'ไม่พบข้อมูลการจอง' };
    }
    
    const headerMap = getHeaderMap(data[0]);
    if (headerMap.start_time === undefined) {
      return { success: false, message: 'ไม่พบคอลัมน์ start_time' };
    }
    
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59);
    
    // กรองข้อมูลเฉพาะเดือนที่เลือก
    const filteredData = [data[0]]; // header row
    for (let i = 1; i < data.length; i++) {
      const startDate = data[i][headerMap.start_time];
      if (startDate instanceof Date && startDate >= firstDayOfMonth && startDate <= lastDayOfMonth) {
        filteredData.push(data[i]);
      }
    }
    
    if (filteredData.length <= 1) {
      return { success: false, message: 'ไม่พบข้อมูลการจองสำหรับเดือนที่เลือก' };
    }
    
    // สร้าง file ชั่วคราว
    const tempSS = SpreadsheetApp.create(`รายงานการจองรถเดือน ${month}-${year}`);
    tempSS.getSheets()[0].getRange(1, 1, filteredData.length, filteredData[0].length).setValues(filteredData);
    
    const file = DriveApp.getFileById(tempSS.getId());
    const url = `https://docs.google.com/spreadsheets/d/${file.getId()}/export?format=csv&id=${file.getId()}`;
    
    // ลบ file ชั่วคราว
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
    
    return { 
      success: true, 
      url: url, 
      message: `ดาวน์โหลดรายงานการจองเดือน ${month}-${year} สำเร็จ` 
    };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}


// ============================================
// REBUILD / BACKFILL BookingsOSP (รันมือจาก Apps Script Editor)
// ============================================

/**
 * ดูตัวอย่างผลก่อนรันจริง (ไม่แก้ไขชีตใดๆ) -> ดูผลที่ View > Logs / Execution log
 */
function previewRebuildBookingsOSP() {
  return rebuildAllBookingsOSP({ dryRun: true });
}

/**
 * สร้างชีต BookingsOSP ใหม่จากข้อมูลจริงทั้งหมด:
 *  - ใช้ทุก booking ที่ booking_status = 'completed' ในชีต Bookings
 *  - รวมยอดเติมน้ำมันจาก BookingLogs + ที่กรอกตอนคืนรถ (Bookings)
 *  - ล้างแถวซ้ำ / แถวของ booking ที่ไม่ completed (เช่น ยกเลิก) ออกทั้งหมด
 *  - เรียงตามวันที่เริ่มใช้รถ และรันลำดับที่ใหม่
 *  - ค่า 'Sap. อ้างอิง' ที่เคยแก้ไขเองใน OSP จะถูกเก็บไว้
 *  - แถวที่ไม่มี _booking_id (คนเพิ่มเองด้วยมือ) จะถูกเก็บไว้ท้ายตาราง
 *  - สำรองชีตเดิมไว้ก่อนเสมอ (BookingsOSP_backup_yyyyMMdd_HHmmss)
 *
 * @param {{dryRun?: boolean, backup?: boolean}} [options]
 */
function rebuildAllBookingsOSP(options) {
  options = options || {};
  const dryRun = options.dryRun === true;
  const doBackup = options.backup !== false;

  const lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT);

  try {
    const sheets = getSheets();
    const ospSheet = getBookingsOSPSheet();
    ensureColumns(ospSheet, CONFIG.BOOKINGS_OSP_HEADERS);

    const lastCol = ospSheet.getLastColumn();
    const ospHeaders = ospSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const ospHeaderMap = getHeaderMap(ospHeaders);
    const idCol = ospHeaderMap['_booking_id'];
    const sapCol = ospHeaderMap['Sap. อ้างอิง'];

    // ---- อ่านชีตแต่ละชีต "ครั้งเดียว" ----
    const bookingData = sheets.Bookings.getDataRange().getValues();
    const bookingHeaderMap = getHeaderMap(bookingData[0]);
    if (bookingHeaderMap.booking_id === undefined || bookingHeaderMap.booking_status === undefined) {
      throw new Error('ชีต Bookings ไม่มีคอลัมน์ booking_id หรือ booking_status');
    }

    const logSheet = getBookingLogsSheet();
    const logData = logSheet.getDataRange().getValues();
    const logHeaderMap = getHeaderMap(logData[0] || []);
    const logsByBooking = {};
    if (logData.length > 1 && logHeaderMap.booking_id !== undefined) {
      for (let i = 1; i < logData.length; i++) {
        const bid = logData[i][logHeaderMap.booking_id];
        if (bid === '' || bid === null || bid === undefined) continue;
        const key = bid.toString();
        (logsByBooking[key] = logsByBooking[key] || []).push(mapBookingLogRow_(logData[i], logHeaderMap));
      }
      Object.keys(logsByBooking).forEach(k => {
        logsByBooking[k].sort((a, b) => new Date(a.log_time) - new Date(b.log_time));
      });
    }

    const ospData = ospSheet.getDataRange().getValues();
    const oldRowCount = Math.max(ospData.length - 1, 0);

    // เก็บ SAP เดิม + แถวที่ไม่มี _booking_id
    const sapById = {};
    const manualRows = [];
    const oldIds = {};
    for (let i = 1; i < ospData.length; i++) {
      const row = ospData[i];
      const id = idCol !== undefined && row[idCol] !== '' && row[idCol] !== null && row[idCol] !== undefined
        ? row[idCol].toString() : '';
      if (id) {
        oldIds[id] = (oldIds[id] || 0) + 1;
        const sap = sapCol !== undefined ? row[sapCol] : '';
        if (sap && sap !== 'ไม่มี SAP') sapById[id] = sap;
      } else if (row.some(c => c !== '' && c !== null)) {
        manualRows.push(row);
      }
    }

    // ---- เลือก booking ที่ completed (ถ้า booking_id ซ้ำ ใช้แถวล่างสุด) ----
    const completedById = {};
    for (let i = 1; i < bookingData.length; i++) {
      const row = bookingData[i];
      const id = row[bookingHeaderMap.booking_id];
      if (id === '' || id === null || id === undefined) continue;
      const status = row[bookingHeaderMap.booking_status]
        ? row[bookingHeaderMap.booking_status].toString().trim().toLowerCase() : '';
      if (status === 'completed') completedById[id.toString()] = row;
      else delete completedById[id.toString()];
    }

    const toTime = (row) => {
      const v = row[bookingHeaderMap.start_time];
      const t = v instanceof Date ? v.getTime() : new Date(v).getTime();
      return isNaN(t) ? 0 : t;
    };
    const completedIds = Object.keys(completedById)
      .sort((a, b) => toTime(completedById[a]) - toTime(completedById[b]));

    // ---- สร้างแถว OSP ใหม่ ----
    const newRows = [];
    const errors = [];
    completedIds.forEach((id, idx) => {
      try {
        const row = buildOSPSummaryRow(
          completedById[id], bookingHeaderMap, logsByBooking[id] || [],
          { headers: ospHeaders, rowNumber: idx + 1 }
        );
        if (sapCol !== undefined && sapById[id]) row[sapCol] = sapById[id];
        newRows.push(row);
      } catch (e) {
        errors.push({ booking_id: id, error: e.message });
      }
    });

    // นับยอดเพื่อรายงาน
    const litersCol = ospHeaderMap['จำนวนลิตรที่เติมน้ำมัน'];
    const amountCol = ospHeaderMap['จำนวนเงินที่เติมน้ำมัน (บาท)'];
    let withFuel = 0, totalLiters = 0, totalAmount = 0;
    newRows.forEach(r => {
      const l = parseFloat(r[litersCol]) || 0, a = parseFloat(r[amountCol]) || 0;
      if (l > 0 || a > 0) withFuel++;
      totalLiters += l; totalAmount += a;
    });

    const summary = {
      dryRun: dryRun,
      completed_bookings: completedIds.length,
      old_osp_rows: oldRowCount,
      new_osp_rows: newRows.length,
      manual_rows_kept: manualRows.length,
      duplicate_rows_removed: Object.keys(oldIds).filter(id => completedById[id])
        .reduce((n, id) => n + oldIds[id] - 1, 0),
      orphan_rows_removed: Object.keys(oldIds).filter(id => !completedById[id])
        .reduce((n, id) => n + oldIds[id], 0),
      rows_added: completedIds.filter(id => !oldIds[id]).length,
      bookings_with_fuel: withFuel,
      total_fuel_liters: Math.round(totalLiters * 100) / 100,
      total_fuel_amount: Math.round(totalAmount * 100) / 100,
      errors: errors,
      backup_sheet: ''
    };

    if (dryRun) {
      Logger.log('rebuildAllBookingsOSP (DRY RUN - ยังไม่แก้ไขชีต): ' + JSON.stringify(summary));
      return summary;
    }

    // ---- สำรองชีตเดิม ----
    if (doBackup) {
      const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
      const backup = ospSheet.copyTo(ss);
      backup.setName('BookingsOSP_backup_' + stamp);
      summary.backup_sheet = backup.getName();
    }

    // ---- เขียนกลับทีเดียว ----
    const finalRows = newRows.concat(manualRows.map(r => {
      const padded = r.slice(0, lastCol);
      while (padded.length < lastCol) padded.push('');
      return padded;
    }));

    if (oldRowCount > 0) {
      ospSheet.getRange(2, 1, oldRowCount, lastCol).clearContent();
    }
    if (finalRows.length > 0) {
      ospSheet.getRange(2, 1, finalRows.length, lastCol).setValues(finalRows);
    }
    SpreadsheetApp.flush();
    invalidateAllCaches();

    Logger.log('rebuildAllBookingsOSP เสร็จสิ้น: ' + JSON.stringify(summary));
    return summary;
  } finally {
    lock.releaseLock();
  }
}