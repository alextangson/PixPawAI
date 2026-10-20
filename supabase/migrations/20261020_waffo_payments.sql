-- Waffo orders are server-owned. Browsers cannot create or modify entitlements.
create table public.waffo_orders (
  id uuid primary key,
  token_hash text not null,
  user_id uuid references auth.users(id) on delete restrict,
  generation_id uuid references public.generations(id) on delete restrict,
  sku text not null check (sku in ('starter','pro','master','hd_unlock')),
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  credits integer not null check (credits >= 0),
  product_id text not null,
  store_id text not null,
  mode text not null check (mode in ('test','prod')),
  session_id text unique,
  provider_order_id text,
  status text not null default 'pending' check (status in ('pending','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (mode, provider_order_id),
  check ((sku = 'hd_unlock' and generation_id is not null and credits = 0)
    or (sku <> 'hd_unlock' and user_id is not null and generation_id is null and credits > 0))
);
alter table public.waffo_orders enable row level security;
create index waffo_orders_user_idx on public.waffo_orders(user_id);
create index waffo_orders_generation_idx on public.waffo_orders(generation_id);

create table public.waffo_events (
  event_id text primary key,
  order_id uuid not null references public.waffo_orders(id),
  created_at timestamptz not null default now()
);
alter table public.waffo_events enable row level security;
revoke all on public.waffo_orders, public.waffo_events from anon, authenticated;
grant all on public.waffo_orders, public.waffo_events to service_role;

create function public.fulfill_waffo_order(
  p_id uuid, p_event_id text, p_provider_order_id text,
  p_amount numeric, p_store_id text, p_mode text
) returns void language plpgsql security definer set search_path = public as $$
declare
  purchase public.waffo_orders%rowtype;
begin
  select * into purchase from public.waffo_orders where id = p_id for update;
  if not found then raise exception 'Unknown order'; end if;
  if purchase.amount_usd <> p_amount or purchase.store_id <> p_store_id or purchase.mode <> p_mode then
    raise exception 'Payment mismatch';
  end if;
  if purchase.provider_order_id is not null and purchase.provider_order_id <> p_provider_order_id then
    raise exception 'Provider order mismatch';
  end if;
  if purchase.status = 'completed' then return; end if;
  insert into public.waffo_events(event_id, order_id) values (p_event_id, p_id);
  -- Test checkout may run against the site's database, but never grants real value.
  if purchase.sku <> 'hd_unlock' and purchase.mode = 'prod' then
    update public.profiles set credits = coalesce(credits, 0) + purchase.credits,
      tier = purchase.sku where id = purchase.user_id;
    if not found then raise exception 'Missing buyer profile'; end if;
  end if;
  update public.waffo_orders set status = 'completed', completed_at = now(),
    provider_order_id = p_provider_order_id where id = p_id;
end;
$$;
revoke all on function public.fulfill_waffo_order(uuid,text,text,numeric,text,text) from public, anon, authenticated;
grant execute on function public.fulfill_waffo_order(uuid,text,text,numeric,text,text) to service_role;
