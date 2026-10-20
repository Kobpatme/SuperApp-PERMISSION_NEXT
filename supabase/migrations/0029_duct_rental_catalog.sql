-- METRIX f87220b: assignable catalog only. No business tables or real-user grants.
-- Keep the module closed via its development/default-disabled manifest.
-- Preserve existing automatic grants except explicitly gated car and duct modules.
create or replace function public.grant_new_permission_to_platform_admin() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.module_id in ('car-booking','duct-rental') or new.code like 'car_booking.%' or new.code like 'duct_rental.%' then return new; end if;
 insert into public.role_permissions(role_id,permission_code)
 select id,new.code from public.roles where code='platform_admin'
 on conflict do nothing;
 return new;
end $$;
insert into public.permissions(code,module_id,resource,action,description) values
 ('duct_rental.module.view','duct-rental','module','view','ดูโมดูลเช่าท่อร้อยสาย'),
 ('duct_rental.request.create','duct-rental','request','create','สร้างคำขอเช่าท่อ'),
 ('duct_rental.request.update','duct-rental','request','update','แก้ไขข้อมูลคำขอเช่าท่อ'),
 ('duct_rental.request.archive','duct-rental','request','archive','เก็บคำขอเช่าท่อเข้าประวัติ'),
 ('duct_rental.document.read','duct-rental','document','read','ดูเอกสารเช่าท่อ'),
 ('duct_rental.document.upload','duct-rental','document','upload','แนบเอกสารเช่าท่อ'),
 ('duct_rental.document.export','duct-rental','document','export','ส่งออกเอกสารเช่าท่อ'),
 ('duct_rental.rate.read','duct-rental','rate','read','ดูอัตราค่าเช่าท่อ'),
 ('duct_rental.design.accept','duct-rental','design','accept','รับงานออกแบบ'),
 ('duct_rental.design.submit','duct-rental','design','submit','ส่งงานออกแบบ'),
 ('duct_rental.draftsman.accept','duct-rental','draftsman','accept','รับงานเขียนแบบ'),
 ('duct_rental.draftsman.submit','duct-rental','draftsman','submit','ส่งงานเขียนแบบ'),
 ('duct_rental.permission1.accept','duct-rental','permission1','accept','รับงานขออนุญาตครั้งที่ 1'),
 ('duct_rental.permission1.submit','duct-rental','permission1','submit','ส่งงานขออนุญาตครั้งที่ 1'),
 ('duct_rental.install.accept','duct-rental','install','accept','รับงานติดตั้ง'),
 ('duct_rental.install.submit','duct-rental','install','submit','ส่งงานติดตั้ง'),
 ('duct_rental.draftsman2.accept','duct-rental','draftsman2','accept','รับงานแบบหลังติดตั้ง'),
 ('duct_rental.draftsman2.submit','duct-rental','draftsman2','submit','ส่งงานแบบหลังติดตั้ง'),
 ('duct_rental.permission2.accept','duct-rental','permission2','accept','รับงานขออนุญาตครั้งที่ 2'),
 ('duct_rental.permission2.submit','duct-rental','permission2','submit','ส่งงานขออนุญาตครั้งที่ 2'),
 ('duct_rental.thirdparty1.accept','duct-rental','thirdparty1','accept','รับงานแจ้งอัตราค่าเช่า'),
 ('duct_rental.thirdparty1.submit','duct-rental','thirdparty1','submit','ส่งงานแจ้งอัตราค่าเช่า'),
 ('duct_rental.permission3.accept','duct-rental','permission3','accept','รับงานดำเนินการชำระเงิน'),
 ('duct_rental.permission3.submit','duct-rental','permission3','submit','ส่งงานดำเนินการชำระเงิน'),
 ('duct_rental.thirdparty2.accept','duct-rental','thirdparty2','accept','รับงานบันทึกสัญญา'),
 ('duct_rental.thirdparty2.submit','duct-rental','thirdparty2','submit','ส่งงานบันทึกสัญญา'),
 ('duct_rental.renewal.create','duct-rental','renewal','create','สร้างงานต่อสัญญารายปี'),
 ('duct_rental.renewal.review','duct-rental','renewal','review','ตรวจเส้นทางและส่งต่อสัญญา'),
 ('duct_rental.renewal.memo','duct-rental','renewal','memo','จัดทำบันทึกต่อสัญญา'),
 ('duct_rental.renewal.confirm','duct-rental','renewal','confirm','ยืนยันผู้ให้บริการต่อสัญญา'),
 ('duct_rental.renewal.contract','duct-rental','renewal','contract','บันทึกสัญญารายปี'),
 ('duct_rental.renewal.archive','duct-rental','renewal','archive','เก็บงานต่อสัญญาเข้าประวัติ'),
 ('duct_rental.cancellation.create','duct-rental','cancellation','create','ขอยกเลิกการใช้ท่อ'),
 ('duct_rental.cancellation.advance','duct-rental','cancellation','advance','ดำเนินงานยกเลิกการใช้ท่อ'),
 ('duct_rental.cancellation.reject','duct-rental','cancellation','reject','ปฏิเสธงานยกเลิกการใช้ท่อ'),
 ('duct_rental.cancellation.archive','duct-rental','cancellation','archive','เก็บงานยกเลิกเข้าประวัติ'),
 ('duct_rental.signoff.assign','duct-rental','signoff','assign','มอบหมายผู้ลงนามเอกสาร'),
 ('duct_rental.signoff.sign','duct-rental','signoff','sign','ลงนามเอกสารที่ได้รับมอบหมาย'),
 ('duct_rental.signoff.revoke','duct-rental','signoff','revoke','ขอให้ลงนามเอกสารใหม่'),
 ('duct_rental.settings.manage','duct-rental','settings','manage','ตั้งค่าโมดูลเช่าท่อร้อยสาย')
on conflict(code) do update set description=excluded.description
where permissions.module_id=excluded.module_id and permissions.resource=excluded.resource and permissions.action=excluded.action;
