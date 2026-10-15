create table if not exists public.traceability_lots (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.traceability_lots
  add column if not exists owner_secret uuid;
alter table public.traceability_lots
  alter column owner_secret drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.traceability_lots'::regclass
      and conname = 'traceability_lots_owner_id_fkey'
  ) then
    alter table public.traceability_lots
      add constraint traceability_lots_owner_id_fkey
      foreign key (owner_id) references auth.users (id) on delete cascade not valid;
  end if;
end;
$$;

grant usage on schema public to anon, authenticated;
alter table public.traceability_lots enable row level security;

revoke all on table public.traceability_lots from public, anon, authenticated;
revoke select (id, record, is_public, created_at, updated_at),
  insert (id, owner_id, owner_secret, record, is_public),
  update (record, is_public, updated_at)
  on table public.traceability_lots from public, anon, authenticated;
grant select (id, record, is_public, created_at, updated_at)
  on table public.traceability_lots to authenticated;
grant insert (id, owner_id, record, is_public)
  on table public.traceability_lots to authenticated;
grant update (record, is_public, updated_at)
  on table public.traceability_lots to authenticated;
grant delete on table public.traceability_lots to authenticated;

drop policy if exists "owners can read their lots" on public.traceability_lots;
drop policy if exists "owners can insert their lots" on public.traceability_lots;
drop policy if exists "owners can update their lots" on public.traceability_lots;
drop policy if exists "owners can delete their lots" on public.traceability_lots;
drop policy if exists "capability can read owner lots" on public.traceability_lots;
drop policy if exists "capability can insert owner lots" on public.traceability_lots;
drop policy if exists "capability can update owner lots" on public.traceability_lots;
drop policy if exists "capability can delete owner lots" on public.traceability_lots;

create policy "owners can read their lots"
  on public.traceability_lots for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "owners can insert their lots"
  on public.traceability_lots for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "owners can update their lots"
  on public.traceability_lots for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "owners can delete their lots"
  on public.traceability_lots for delete to authenticated
  using ((select auth.uid()) = owner_id);

create or replace view public.public_traceability_lots
  with (security_barrier = true)
as
  select
    id,
    jsonb_build_object(
      'id', record->'id',
      'product', record->'product',
      'characteristics', record->'characteristics',
      'origin', record->'origin',
      'originDate', record->'originDate',
      'organization', record->'organization',
      'createdBy', 'Responsable de la organización',
      'createdByRole', record->'createdByRole',
      'isPublic', true,
      'createdAt', record->'createdAt',
      'events', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', event->'id',
              'type', event->'type',
              'occurredAt', event->'occurredAt',
              'recordedAt', event->'recordedAt',
              'actorRole', event->'actorRole',
              'organization', event->'organization',
              'details', event->'details',
              'evidenceSha256', event->'evidenceSha256'
            ) order by event->>'occurredAt'
          )
          from jsonb_array_elements(coalesce(record->'events', '[]'::jsonb)) as events(event)
        ),
        '[]'::jsonb
      ),
      'certificates', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', certificate->'id',
              'name', certificate->'name',
              'issuer', certificate->'issuer',
              'certificateNumber', certificate->'certificateNumber',
              'issuedAt', certificate->'issuedAt',
              'validUntil', certificate->'validUntil',
              'evidenceSha256', certificate->'evidenceSha256',
              'recordedByRole', certificate->'recordedByRole',
              'recordedByOrganization', certificate->'recordedByOrganization',
              'recordedAt', certificate->'recordedAt'
            ) order by certificate->>'recordedAt'
          )
          from jsonb_array_elements(coalesce(record->'certificates', '[]'::jsonb)) as certificates(certificate)
        ),
        '[]'::jsonb
      )
    ) as public_record
  from public.traceability_lots
  where is_public = true;

revoke all on public.public_traceability_lots from public;
grant select on public.public_traceability_lots to anon, authenticated;