-- Normalize the permission catalog's module ids to the module registry ids.
-- Seeds from earlier migrations used singular names (building, guarantee) while
-- the admin role editor writes the manifest id (buildings, guarantees), so one
-- catalog column held two spellings for the same module. No runtime code reads
-- this column; it exists to keep the catalog joinable and reportable.
update public.permissions set module_id = 'buildings' where code like 'building.%' and module_id <> 'buildings';
update public.permissions set module_id = 'buildings' where code like 'pricing.%' and module_id <> 'buildings';
update public.permissions set module_id = 'guarantees' where code like 'guarantee.%' and module_id <> 'guarantees';
update public.permissions set module_id = 'work' where (code like 'work.%' or code like 'kpi.%') and module_id <> 'work';
update public.permissions set module_id = 'core' where (code like 'core.%' or code like 'activity.%' or code like 'notification.%') and module_id <> 'core';
update public.permissions set module_id = 'car-booking' where code like 'car\_booking.%' and module_id <> 'car-booking';
update public.permissions set module_id = 'duct-rental' where code like 'duct\_rental.%' and module_id <> 'duct-rental';
update public.permissions set module_id = 'po-tracking' where code like 'po\_tracking.%' and module_id <> 'po-tracking';
update public.permissions set module_id = 'permission-out' where code like 'permission\_out.%' and module_id <> 'permission-out';
update public.permissions set module_id = 'site-facility' where code like 'site\_facility.%' and module_id <> 'site-facility';
