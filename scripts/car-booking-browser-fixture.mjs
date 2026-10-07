import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
const db=postgres(carBookingTestUrl().href,{max:1,onnotice:()=>{}});
const users=[
 ['00000000-0000-4000-8000-000000001001','staff@car.example.test','พนักงานจองรถ','car_booking_use'],
 ['00000000-0000-4000-8000-000000001002','other@car.example.test','ผู้ใช้อื่น','car_booking_use'],
 ['00000000-0000-4000-8000-000000001003','admin@car.example.test','แอดมินจองรถ','car_booking_admin'],
 ['00000000-0000-4000-8000-000000001004','noaccess@car.example.test','ผู้ใช้รอสิทธิ์','car_fixture_work'],
 ['00000000-0000-4000-8000-000000001005','temporary@car.example.test','ผู้ใช้รหัสชั่วคราว','car_booking_use'],
];
try {
 const passwordHash=await hash('FixturePassword123!',{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
 await db.begin(async tx=>{
  await tx`insert into roles(code,name,is_system) values('car_fixture_work','Synthetic work scope',false),('car_fixture_core','Synthetic access manager',false) on conflict(code) do nothing`;
  await tx`insert into role_permissions(role_id,permission_code) select id,'work.task.read' from roles where code='car_fixture_work' on conflict do nothing`;
  await tx`insert into role_permissions(role_id,permission_code) select r.id,p.code from roles r cross join permissions p where r.code='car_fixture_core' and p.code in ('core.user.manage','core.profile.read') on conflict do nothing`;
  for(const [id,email,name,role] of users){
   await tx`insert into profiles(id,email,display_name,status) values(${id},${email},${name},'active') on conflict(id) do update set display_name=excluded.display_name,status='active'`;
   await tx`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${passwordHash},${email.startsWith('temporary')}) on conflict(user_id) do update set password_hash=excluded.password_hash,must_change_password=excluded.must_change_password,failed_attempts=0,locked_until=null`;
   await tx`delete from auth_sessions where user_id=${id}`;
   await tx`delete from auth_rate_limits where subject_type='email' and subject_key=${email}`;
   await tx`update user_role_assignments set valid_until=now() where user_id=${id} and valid_until is null`;
   for(const code of [role,...(email.startsWith('admin')?['car_fixture_core']:[])]){
    const [assignment]=await tx`insert into user_role_assignments(user_id,role_id) select ${id},id from roles where code=${code} returning id`;
    await tx`insert into data_scope_grants(assignment_id,scope_type) values(${assignment.id},${code==='car_booking_admin' || code==='car_fixture_core'?'ALL':'OWN'})`;
   }
  }
  // Preserve previous test history; cancel only synthetic open bookings on these cars/users.
  await tx`update car_booking_bookings set status='cancelled',cancelled_at=now() where status='booked' and user_id in ${tx(users.map(user=>user[0]))}`;
  for(const [id,plate] of [['00000000-0000-4000-8000-000000001201','ทดสอบ 1001'],['00000000-0000-4000-8000-000000001202','ทดสอบ 1002'],['00000000-0000-4000-8000-000000001203','ทดสอบค้างคืน']]){
   await tx`insert into car_booking_cars(id,license_plate,parking_floor,latest_mileage,is_active) values(${id},${plate},'2A',100,true) on conflict(id) do update set latest_mileage=100,parking_floor='2A',is_active=true`;
  }
  const now=new Date(),start=new Date(now.getTime()-3600000).toISOString(),end=new Date(now.getTime()+3600000).toISOString();
  await tx`insert into car_booking_bookings(id,user_id,employee_name,car_id,destination,start_time,end_time,start_mileage)
   values('00000000-0000-4000-8000-000000001101',${users[1][0]},${users[1][2]},'00000000-0000-4000-8000-000000001201','ปลายทางส่วนตัวอื่น',${start},${end},100)
   on conflict(id) do update set start_time=excluded.start_time,end_time=excluded.end_time,status='booked',actual_return_time=null,mileage_on_return=null`;
  await tx`insert into car_booking_logs(id,booking_id,log_time,log_type,location,mileage,created_by,gps_latitude,gps_longitude,gps_accuracy_meters)
   values('00000000-0000-4000-8000-000000001301','00000000-0000-4000-8000-000000001101',${start},'checkpoint','จุดแวะทดสอบ',110,${users[1][0]},13.75,100.5,10) on conflict(id) do nothing`;
  const oldStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-2,1)).toISOString(),oldEnd=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-2,2)).toISOString();
  await tx`insert into car_booking_bookings(user_id,employee_name,car_id,destination,start_time,end_time,start_mileage)
   values(${users[0][0]},${users[0][2]},'00000000-0000-4000-8000-000000001203','รายการค้างจากเดือนก่อน',${oldStart},${oldEnd},100)`;
 });
 console.log('Synthetic car browser fixture ready (no existing application database writes)');
}finally{await db.end();}
