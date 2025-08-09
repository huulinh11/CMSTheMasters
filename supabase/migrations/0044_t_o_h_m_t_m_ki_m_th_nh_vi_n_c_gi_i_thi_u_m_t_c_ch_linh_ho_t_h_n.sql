create or replace function get_referred_guests(referrer_name_in text)
returns table(id text, name text, role text, phone text, type text)
language plpgsql
as $$
begin
  return query
  select g.id, g.name, g.role, g.phone, 'Khách mời' as type
  from public.guests as g
  where trim(lower(g.referrer)) = trim(lower(referrer_name_in))
  union all
  select vg.id, vg.name, vg.role, vg.phone, 'Chức vụ' as type
  from public.vip_guests as vg
  where trim(lower(vg.referrer)) = trim(lower(referrer_name_in));
end;
$$;