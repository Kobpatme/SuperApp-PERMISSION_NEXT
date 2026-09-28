-- Installation/TL teams are scoped by the operational Area used by the
-- original guarantee workflow. Historical work is reassigned without loss.
insert into public.teams(code,name,is_active) values
  ('installation_bkk_1','ทีมติดตั้ง BKK 1',true),
  ('installation_bkk_2','ทีมติดตั้ง BKK 2',true),
  ('installation_bkk_3','ทีมติดตั้ง BKK 3',true),
  ('installation_bkk_4','ทีมติดตั้ง BKK 4',true),
  ('installation_cbi','ทีมติดตั้ง CBI',true),
  ('installation_cmi','ทีมติดตั้ง CMI',true),
  ('installation_pkt','ทีมติดตั้ง PKT',true),
  ('installation_sni','ทีมติดตั้ง SNI',true)
on conflict(code) do update set name=excluded.name,is_active=true,updated_at=now();

update public.guarantee_work_items item
set team_id=team.id,updated_at=now()
from public.teams team
where team.code = 'installation_' || lower(replace(item.area,' ','_'))
  and item.area in ('BKK 1','BKK 2','BKK 3','BKK 4','CBI','CMI','PKT','SNI')
  and item.team_id is distinct from team.id;

