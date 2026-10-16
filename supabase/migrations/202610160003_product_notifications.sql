create table if not exists public.product_notification_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  product text not null check (product in ('Café orgánico', 'Cacao orgánico', 'Algodón orgánico')),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  lot_id uuid not null references public.traceability_lots (id) on delete cascade,
  product text not null check (product in ('Café orgánico', 'Cacao orgánico', 'Algodón orgánico')),
  summary text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, lot_id)
);

alter table public.product_notification_subscriptions enable row level security;
alter table public.product_notifications enable row level security;

revoke all on public.product_notification_subscriptions from public, anon, authenticated;
revoke all on public.product_notifications from public, anon, authenticated;
grant select, insert, update, delete on public.product_notification_subscriptions to authenticated;
grant select on public.product_notifications to authenticated;
grant update (read_at) on public.product_notifications to authenticated;

drop policy if exists "users manage their product notification subscription"
  on public.product_notification_subscriptions;
create policy "users manage their product notification subscription"
  on public.product_notification_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users read their product notifications" on public.product_notifications;
create policy "users read their product notifications"
  on public.product_notifications
  for select to authenticated
  using ((select auth.uid()) = recipient_id);

drop policy if exists "users mark their product notifications read" on public.product_notifications;
create policy "users mark their product notifications read"
  on public.product_notifications
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

create or replace function public.notify_subscribers_of_public_lot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product text;
  v_should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_notify := new.is_public;
  else
    v_should_notify := new.is_public and (
      not old.is_public or old.record->>'product' is distinct from new.record->>'product'
    );
  end if;

  v_product := new.record->>'product';
  if v_should_notify and v_product in ('Café orgánico', 'Cacao orgánico', 'Algodón orgánico') then
    insert into public.product_notifications (recipient_id, lot_id, product, summary)
    select subscription.user_id,
           new.id,
           v_product,
           'Se publicó un nuevo lote de ' || lower(v_product) || '.'
    from public.product_notification_subscriptions as subscription
    where subscription.product = v_product
    on conflict (recipient_id, lot_id) do update
      set product = excluded.product,
          summary = excluded.summary,
          created_at = now(),
          read_at = null;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_subscribers_of_public_lot() from public, anon, authenticated;

drop trigger if exists notify_subscribers_of_public_lot on public.traceability_lots;
create trigger notify_subscribers_of_public_lot
  after insert or update of is_public, record on public.traceability_lots
  for each row execute function public.notify_subscribers_of_public_lot();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.product_notifications;
    exception when duplicate_object then
      null;
    end;
  end if;
end;
$$;