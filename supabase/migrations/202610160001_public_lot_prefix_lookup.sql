create or replace function public.find_public_traceability_lots_by_prefix(
  p_id_prefix text,
  p_product text
)
returns table (id uuid, public_record jsonb)
language sql
stable
set search_path = ''
as $$
  select lot.id, lot.public_record
  from public.public_traceability_lots as lot
  where length(p_id_prefix) between 8 and 36
    and lower(p_id_prefix) ~ '^[0-9a-f]{8}[0-9a-f-]*$'
    and lot.id::text like lower(p_id_prefix) || '%'
    and lot.public_record ->> 'product' = p_product
  order by lot.id
  limit 21;
$$;

revoke all on function public.find_public_traceability_lots_by_prefix(text, text) from public;
grant execute on function public.find_public_traceability_lots_by_prefix(text, text) to anon, authenticated;