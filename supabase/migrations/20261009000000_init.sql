-- Esquema de la app Impresora térmica. Ejecutar una vez en Supabase → SQL Editor.
-- Acceso: solo las cuentas registradas en `members` leen y escriben (Row Level Security).

-- Cuentas autorizadas (la cuenta compartida del negocio).
create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;
-- Cada cuenta puede ver si ella misma es miembro; nadie puede agregarse desde la app.
create policy "members: ver la propia fila" on public.members
  for select to authenticated using (user_id = (select auth.uid()));

-- security definer: consulta `members` sin depender de sus políticas.
create function public.is_member() returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.members where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

create table public.products (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price integer not null check (price between 0 and 100000000),
  code text check (code is null or char_length(code) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index products_code_unique on public.products (code) where code is not null;

create table public.business (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'MI NEGOCIO' check (char_length(btrim(name)) between 1 and 48),
  address text not null default '' check (char_length(address) <= 200),
  phone text not null default '' check (char_length(phone) <= 40),
  footer text not null default '¡Gracias por su compra!' check (char_length(footer) <= 200)
);
insert into public.business (id) values (1);

-- updated_at se mantiene en la base, no lo manda la app.
create function public.touch_updated_at() returns trigger
  language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
alter table public.business enable row level security;

create policy "products: miembros leen" on public.products for select to authenticated using ((select public.is_member()));
create policy "products: miembros crean" on public.products for insert to authenticated with check ((select public.is_member()));
create policy "products: miembros editan" on public.products for update to authenticated using ((select public.is_member())) with check ((select public.is_member()));
create policy "products: miembros borran" on public.products for delete to authenticated using ((select public.is_member()));

-- El negocio es una sola fila: se lee y se edita, no se crea ni se borra desde la app.
create policy "business: miembros leen" on public.business for select to authenticated using ((select public.is_member()));
create policy "business: miembros editan" on public.business for update to authenticated using ((select public.is_member())) with check ((select public.is_member()));
