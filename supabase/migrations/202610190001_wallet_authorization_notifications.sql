create table if not exists public.wallet_authorization_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^G[A-Z2-7]{55}$'),
  transaction_hash text not null check (transaction_hash ~ '^[0-9a-f]{64}$'),
  authorized boolean not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, transaction_hash)
);

alter table public.wallet_authorization_notifications enable row level security;
revoke all on public.wallet_authorization_notifications from public, anon, authenticated;
grant select on public.wallet_authorization_notifications to authenticated;
grant update (read_at) on public.wallet_authorization_notifications to authenticated;

drop policy if exists "users read their wallet authorization notifications"
  on public.wallet_authorization_notifications;
create policy "users read their wallet authorization notifications"
  on public.wallet_authorization_notifications
  for select to authenticated
  using ((select auth.uid()) = recipient_id);

drop policy if exists "users mark their wallet authorization notifications read"
  on public.wallet_authorization_notifications;
create policy "users mark their wallet authorization notifications read"
  on public.wallet_authorization_notifications
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

create or replace function public.notify_own_wallet_authorization(
  p_wallet_address text,
  p_transaction_hash text,
  p_authorized boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null
    or p_wallet_address !~ '^G[A-Z2-7]{55}$'
    or p_transaction_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into public.wallet_authorization_notifications (
    recipient_id,
    wallet_address,
    transaction_hash,
    authorized
  ) values (
    v_user_id,
    p_wallet_address,
    p_transaction_hash,
    p_authorized
  )
  on conflict (recipient_id, transaction_hash) do nothing;

  return true;
end;
$$;

revoke all on function public.notify_own_wallet_authorization(text, text, boolean) from public, anon;
grant execute on function public.notify_own_wallet_authorization(text, text, boolean) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.wallet_authorization_notifications;
    exception when duplicate_object then
      null;
    end;
  end if;
end;
$$;