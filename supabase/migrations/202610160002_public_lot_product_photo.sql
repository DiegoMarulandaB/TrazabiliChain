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
      'photoDataUrl', record->'photoDataUrl',
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