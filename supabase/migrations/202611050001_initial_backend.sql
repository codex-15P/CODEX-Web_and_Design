-- CODEX V2 backend foundation
-- Apply only after creating a Supabase project and reviewing the setup guide.
-- No service-role secrets belong in this migration or in browser code.

create extension if not exists pgcrypto;

-- Keep authorization helpers outside the API-exposed public schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create type public.codex_user_role as enum ('member', 'team', 'admin');
create type public.project_status as enum ('draft', 'published', 'upcoming', 'archived');
create type public.comment_status as enum ('pending', 'approved', 'hidden');
create type public.conversation_kind as enum ('customer', 'team');
create type public.enquiry_status as enum ('pending', 'in_progress', 'completed', 'spam');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  role public.codex_user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  status public.project_status not null default 'draft',
  public_url text,
  preview_image_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_public_url_scheme check (public_url is null or public_url ~ '^https?://')
);

create table public.project_reactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction smallint not null check (reaction in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  status public.comment_status not null default 'pending',
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind public.conversation_kind not null,
  title text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(btrim(customer_name)) between 1 and 160),
  customer_whatsapp text not null check (length(btrim(customer_whatsapp)) between 5 and 40),
  customer_email text check (customer_email is null or length(btrim(customer_email)) between 3 and 320),
  service text not null check (length(btrim(service)) between 1 and 160),
  project_title text not null check (length(btrim(project_title)) between 1 and 200),
  details text not null check (length(btrim(details)) between 1 and 8000),
  budget_text text check (budget_text is null or length(btrim(budget_text)) <= 160),
  requested_deadline date,
  reference_links text check (reference_links is null or length(btrim(reference_links)) <= 4000),
  status public.enquiry_status not null default 'pending',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Store a random browser-generated visitor key and page path only. Do not store IPs,
-- names, email addresses, query strings, or other identifying data in this table.
create table public.page_events (
  id uuid primary key default gen_random_uuid(),
  visitor_key uuid not null,
  page_path text not null check (page_path ~ '^/[A-Za-z0-9/_.-]*$'),
  occurred_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(btrim(action)) between 1 and 120),
  target_type text not null check (length(btrim(target_type)) between 1 and 80),
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index project_comments_public_idx on public.project_comments (project_id, created_at desc) where status = 'approved';
create index project_reactions_project_idx on public.project_reactions (project_id);
create index conversations_creator_idx on public.conversations (created_by, created_at desc);
create index conversation_members_user_idx on public.conversation_members (user_id, conversation_id);

create function private.add_conversation_creator()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.conversation_members (conversation_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger conversation_add_creator after insert on public.conversations
  for each row execute function private.add_conversation_creator();
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index enquiries_status_created_idx on public.enquiries (status, created_at desc);
create index enquiries_assignee_idx on public.enquiries (assigned_to, status);
create index page_events_occurred_idx on public.page_events (occurred_at desc);
create index page_events_path_occurred_idx on public.page_events (page_path, occurred_at desc);
create index page_events_visitor_occurred_idx on public.page_events (visitor_key, occurred_at desc);

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();

create function private.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile IDs cannot be changed';
  end if;
  -- SQL Editor runs as the database owner. Allow its trusted bootstrap action
  -- while blocking role changes through ordinary authenticated client requests.
  if new.role is distinct from old.role
     and session_user <> 'postgres'
     and not (select private.is_codex_admin()) then
    raise exception 'Only a CODEX administrator can change account roles';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard before update on public.profiles
  for each row execute function private.prevent_profile_role_escalation();
create trigger projects_touch before update on public.projects for each row execute function private.touch_updated_at();
create trigger project_reactions_touch before update on public.project_reactions for each row execute function private.touch_updated_at();
create trigger project_comments_touch before update on public.project_comments for each row execute function private.touch_updated_at();
create trigger conversations_touch before update on public.conversations for each row execute function private.touch_updated_at();
create trigger enquiries_touch before update on public.enquiries for each row execute function private.touch_updated_at();

create function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 100), 'member');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_auth_user();

-- These SECURITY DEFINER helpers avoid recursive RLS checks on membership/role tables.
create function private.is_codex_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create function private.is_conversation_member(target_conversation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = target_conversation and cm.user_id = (select auth.uid())
  );
$$;

create function private.is_team_or_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('team', 'admin')
  );
$$;

create function private.write_admin_audit_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  changed_row jsonb;
begin
  if tg_op = 'DELETE' then
    changed_row := to_jsonb(old);
  else
    changed_row := to_jsonb(new);
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id)
  values ((select auth.uid()), lower(tg_op), tg_table_name, nullif(changed_row ->> 'id', '')::uuid);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_reactions enable row level security;
alter table public.project_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.enquiries enable row level security;
alter table public.page_events enable row level security;
alter table public.admin_audit_log enable row level security;

-- Record operation metadata only; never copy enquiry, comment, or message text into the audit trail.
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function private.write_admin_audit_event();
create trigger audit_projects after insert or update or delete on public.projects for each row execute function private.write_admin_audit_event();
create trigger audit_reactions after insert or update or delete on public.project_reactions for each row execute function private.write_admin_audit_event();
create trigger audit_comments after insert or update or delete on public.project_comments for each row execute function private.write_admin_audit_event();
create trigger audit_conversations after insert or update or delete on public.conversations for each row execute function private.write_admin_audit_event();
create trigger audit_messages after insert or update or delete on public.messages for each row execute function private.write_admin_audit_event();
create trigger audit_enquiries after insert or update or delete on public.enquiries for each row execute function private.write_admin_audit_event();

create policy "profiles readable by self or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_codex_admin()));
create policy "profiles editable by self or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_codex_admin()))
  with check (id = (select auth.uid()) or (select private.is_codex_admin()));
create policy "admins update profiles" on public.profiles for update to authenticated
  using ((select private.is_codex_admin())) with check ((select private.is_codex_admin()));

create policy "published projects are public" on public.projects for select to anon, authenticated
  using (status = 'published' or (select private.is_codex_admin()));
create policy "admins manage projects" on public.projects for all to authenticated
  using ((select private.is_codex_admin())) with check ((select private.is_codex_admin()));

create policy "users see own reactions" on public.project_reactions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_codex_admin()));
create policy "users create own reactions on published projects" on public.project_reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.projects p where p.id = project_id and p.status = 'published'
  ));
create policy "users change own reactions on published projects" on public.project_reactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists (
    select 1 from public.projects p where p.id = project_id and p.status = 'published'
  ));
create policy "users remove own reactions" on public.project_reactions for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_codex_admin()));

create policy "approved comments are public" on public.project_comments for select to anon, authenticated
  using (
    (status = 'approved' and exists (
      select 1 from public.projects p where p.id = project_id and p.status = 'published'
    )) or user_id = (select auth.uid()) or (select private.is_codex_admin())
  );
create policy "signed-in users submit comments for review" on public.project_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and moderated_by is null and moderated_at is null and exists (
    select 1 from public.projects p where p.id = project_id and p.status = 'published'
  ));
create policy "users edit own pending comments" on public.project_comments for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending' and moderated_by is null and moderated_at is null and exists (
    select 1 from public.projects p where p.id = project_id and p.status = 'published'
  ));
create policy "admins moderate comments" on public.project_comments for update to authenticated
  using ((select private.is_codex_admin())) with check ((select private.is_codex_admin()));

create policy "participants or admins view conversations" on public.conversations for select to authenticated
  using ((select private.is_conversation_member(id)) or (select private.is_codex_admin()));
create policy "signed-in users start customer conversations" on public.conversations for insert to authenticated
  with check (
    (kind = 'customer' and created_by = (select auth.uid())) or
    (kind = 'team' and created_by = (select auth.uid()) and private.is_team_or_admin())
  );
create policy "admins manage conversations" on public.conversations for all to authenticated
  using ((select private.is_codex_admin())) with check ((select private.is_codex_admin()));

create policy "participants or admins view members" on public.conversation_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_conversation_member(conversation_id)) or (select private.is_codex_admin()));
create policy "admins assign conversation members" on public.conversation_members for insert to authenticated
  with check ((select private.is_codex_admin()));
create policy "admins remove conversation members" on public.conversation_members for delete to authenticated
  using ((select private.is_codex_admin()));

create policy "participants or admins view messages" on public.messages for select to authenticated
  using ((select private.is_conversation_member(conversation_id)) or (select private.is_codex_admin()));
create policy "participants send messages as themselves" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and (select private.is_conversation_member(conversation_id)));
create policy "admins delete messages" on public.messages for delete to authenticated
  using ((select private.is_codex_admin()));

-- Enquiry writes stay closed until a rate-limited server endpoint is deployed.
create policy "admins view enquiries" on public.enquiries for select to authenticated
  using ((select private.is_codex_admin()));
create policy "admins manage enquiries" on public.enquiries for update to authenticated
  using ((select private.is_codex_admin())) with check ((select private.is_codex_admin()));
create policy "admins delete enquiries" on public.enquiries for delete to authenticated
  using ((select private.is_codex_admin()));

-- Page-event inserts remain disabled until a rate-limited server endpoint exists.
create policy "admins view page events" on public.page_events for select to authenticated
  using ((select private.is_codex_admin()));
create policy "admins clean page events" on public.page_events for delete to authenticated
  using ((select private.is_codex_admin()));

create policy "admins view audit log" on public.admin_audit_log for select to authenticated
  using ((select private.is_codex_admin()));

-- Keep private helpers callable only by roles whose policies need them.
revoke all on all functions in schema private from public;
revoke all on all functions in schema private from anon, authenticated;
grant execute on function private.is_codex_admin() to anon, authenticated;
grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.is_team_or_admin() to authenticated;

-- Clear inherited privileges before granting only intended table operations.
revoke all on table public.profiles, public.projects, public.project_reactions,
  public.project_comments, public.conversations, public.conversation_members,
  public.messages, public.enquiries, public.page_events, public.admin_audit_log
  from anon, authenticated;

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select on public.project_comments to anon, authenticated;
-- No direct browser insert on enquiries; the future server endpoint will validate and rate-limit writes.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.project_reactions to authenticated;
grant select, insert, update on public.project_comments to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, delete on public.conversation_members to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant select, delete on public.page_events to authenticated;
grant select on public.admin_audit_log to authenticated;
