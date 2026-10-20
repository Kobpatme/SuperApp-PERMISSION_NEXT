import { headers } from './car-booking-import-core.mjs';
export const csv=(sheet,rows)=>'\ufeff'+[headers[sheet],...rows.map(r=>headers[sheet].map(k=>String(r[k]??'')))].map(r=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
export function fixture(first='11111111-1111-4111-a111-111111111111',second='22222222-2222-4222-a222-222222222222') {
 const data={
  Employees:[{id:"'00101",name:'Synthetic user',role:'admin'},{id:'102',name:'Second user',role:'user'}],
  Cars:[{car_id:'1',license_plate:'IMPORT-SYNTHETIC',parking_floor:'2A',latest_mileage:'100'}],
  Bookings:[{booking_id:'legacy-completed',employee_id:'101',employee_name:'Synthetic user',car_plate:'IMPORT-SYNTHETIC',destination:'Synthetic destination, "quoted"\nsecond line',start_time:'2035-01-01 08:00:00',end_time:'2035-01-01 10:00:00',booking_status:'completed',start_mileage:'0',mileage_on_return:'100',actual_return_time:'2035-01-01 11:00:00',parking_floor:'2A',refueled:'true',fuel_mileage:'90',fuel_liters:'30',fuel_amount:'1200'}],
  BookingLogs:[{log_id:'legacy-fuel',booking_id:'legacy-completed',log_time:'2035-01-01 09:00:00',log_type:'fuel',location:'Synthetic fuel',mileage:'50',refueled:'true',fuel_liters:'10',fuel_amount:'400',note:'Synthetic',gps_latitude:'0',gps_longitude:'0',gps_accuracy_meters:'0',created_by:'101',created_at:'2035-01-01 09:00:00'}],
  BookingsOSP:[{_booking_id:'legacy-completed'}],
 };
 const snapshot={profiles:[{id:first,employee_code:'101',status:'active'},{id:second,employee_code:'000102',status:'active'}],cars:[],bookings:[],logs:[]};
 return {data,snapshot,files:Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,csv(name,rows)]))};
}
