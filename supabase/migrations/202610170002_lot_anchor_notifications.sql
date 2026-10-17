create table if not exists public.lot_anchor_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  lot_id uuid not null references public.traceability_lots (id) on delete cascade,
  product text not null,
  transaction_hash text not null check (transaction_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, transaction_hash)
);

alter table public.lot_anchor_notifications enable row level security;
revoke all on public.lot_anchor_notifications from public, anon, authenticated;
grant select on public.lot_anchor_notifications to authenticated;
grant update (read_at) on public.lot_anchor_notifications to authenticated;

drop policy if exists "users read their lot anchor notifications"
  on public.lot_anchor_notifications;
create policy "users read their lot anchor notifications"
  on public.lot_anchor_notifications
  for select to authenticated
  using ((select auth.uid()) = recipient_id);

drop policy if exists "users mark their lot anchor notifications read"
  on public.lot_anchor_notifications;
create policy "users mark their lot anchor notifications read"
  on public.lot_anchor_notifications
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

create or replace function public.notify_lot_owner_of_anchor(
  p_lot_id uuid,
  p_transaction_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_product text;
begin
  if v_user_id is null or p_transaction_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  select record->>'product'
  into v_product
  from public.traceability_lots
  where id = p_lot_id and owner_id = v_user_id;

  if not found then
    return false;
  end if;

  insert into public.lot_anchor_notifications (
    recipient_id,
    lot_id,
    product,
    transaction_hash
  ) values (
    v_user_id,
    p_lot_id,
    coalesce(v_product, 'Lote'),
    p_transaction_hash
  )
  on conflict (recipient_id, transaction_hash) do nothing;

  return true;
end;
$$;

revoke all on function public.notify_lot_owner_of_anchor(uuid, text) from public, anon;
grant execute on function public.notify_lot_owner_of_anchor(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.lot_anchor_notifications;
    exception when duplicate_object then
      null;
    end;
  end if;
end;
$$;