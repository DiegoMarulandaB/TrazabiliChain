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
  v_product := new.record->>'product';

  if tg_op = 'UPDATE' and old.is_public and not new.is_public then
    delete from public.product_notifications where lot_id = new.id;
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_should_notify := new.is_public;
  else
    v_should_notify := new.is_public and (
      not old.is_public or old.record->>'product' is distinct from v_product
    );
  end if;

  if tg_op = 'UPDATE'
    and old.is_public
    and new.is_public
    and old.record->>'product' is distinct from v_product then
    delete from public.product_notifications
    where lot_id = new.id and product is distinct from v_product;
  end if;

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