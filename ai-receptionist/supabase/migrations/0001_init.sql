-- AI receptionist: multi-tenant schema.
-- Roles: 'admin' (agency, sees every business) and 'client' (sees only their business).

create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  twilio_number text unique,
  forward_to text,
  owner_phone text,
  time_zone text not null default 'America/New_York',
  -- {"0": null, "1": "09:00-17:00", ...} keyed by weekday, 0 = Sunday
  hours jsonb not null default '{"1":"09:00-17:00","2":"09:00-17:00","3":"09:00-17:00","4":"09:00-17:00","5":"09:00-17:00"}',
  services jsonb not null default '[]',
  faq text not null default '',
  slot_minutes int not null default 30 check (slot_minutes between 5 and 480),
  missed_call_text text,
  brand_color text not null default '#2563eb',
  logo_url text,
  ai_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'client' check (role in ('admin', 'client')),
  business_id uuid references public.businesses on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  channel text not null check (channel in ('sms', 'test')),
  contact_phone text not null,
  contact_name text,
  ai_paused boolean not null default false,
  -- Claude message history (Anthropic.MessageParam[]) so tool calls survive between texts
  history jsonb not null default '[]',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, channel, contact_phone)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  business_id uuid not null references public.businesses on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender text not null check (sender in ('contact', 'ai', 'human', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  conversation_id uuid references public.conversations on delete set null,
  contact_name text not null,
  contact_phone text,
  service text,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source text not null check (source in ('sms', 'voice', 'test', 'manual')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  external_id text unique,
  from_number text,
  status text not null,
  created_at timestamptz not null default now()
);

create index on public.conversations (business_id, last_message_at desc);
create index on public.messages (conversation_id, created_at);
create index on public.bookings (business_id, starts_at);

-- Helpers used by RLS policies. security definer so they can read profiles without recursion.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function public.my_business_id() returns uuid
language sql stable security definer set search_path = public as $$
  select business_id from profiles where id = auth.uid();
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;
alter table public.calls enable row level security;

create policy "admin all" on public.businesses for all using (is_admin()) with check (is_admin());
create policy "client read own" on public.businesses for select using (id = my_business_id());
create policy "client update own" on public.businesses for update
  using (id = my_business_id()) with check (id = my_business_id());

create policy "self read" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "admin write" on public.profiles for all using (is_admin()) with check (is_admin());

do $$
declare t text;
begin
  foreach t in array array['conversations', 'messages', 'bookings', 'calls'] loop
    execute format(
      'create policy "tenant access" on public.%I for all
         using (is_admin() or business_id = my_business_id())
         with check (is_admin() or business_id = my_business_id())', t);
  end loop;
end $$;

-- Clients can edit their business, but phone routing stays agency-controlled even via the raw API.
create function public.guard_business_routing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin()
     and (new.twilio_number is distinct from old.twilio_number
          or new.forward_to is distinct from old.forward_to) then
    raise exception 'Only the agency can change phone routing';
  end if;
  return new;
end;
$$;

create trigger guard_business_routing
  before update on public.businesses
  for each row execute function public.guard_business_routing();

-- New auth users get a profile. Invites carry business_id in user metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, business_id)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'business_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Make yourself admin after first sign-up:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
