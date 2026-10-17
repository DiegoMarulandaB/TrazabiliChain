create table if not exists public.traceability_work_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  profile text not null check (profile in (
    'producer',
    'supplyActor',
    'certifier',
    'organizationAdmin',
    'b2bBuyer',
    'auditor',
    'consumer'
  )),
  product text not null check (product in ('Café orgánico', 'Cacao orgánico', 'Algodón orgánico')),
  draft_key text not null check (length(draft_key) between 1 and 64),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, profile, product, draft_key)
);

alter table public.traceability_work_drafts enable row level security;
revoke all on public.traceability_work_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.traceability_work_drafts to authenticated;

drop policy if exists "users manage their work drafts" on public.traceability_work_drafts;
create policy "users manage their work drafts"
  on public.traceability_work_drafts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);