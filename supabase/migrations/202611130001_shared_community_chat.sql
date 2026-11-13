-- CODEX shared community chat: one room for all visitors, with named users,
-- private voice notes, and administrator moderation.
alter table public.profiles
  add column if not exists chat_username text,
  add column if not exists chat_suspended boolean not null default false;

create unique index if not exists profiles_chat_username_ci_uidx
  on public.profiles (lower(chat_username)) where chat_username is not null;
grant update (chat_username) on public.profiles to authenticated;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_chat_username_format') then
    alter table public.profiles add constraint profiles_chat_username_format
      check (chat_username is null or (chat_username ~ '^[A-Za-z][A-Za-z0-9_]{2,23}$'
        and lower(chat_username) not in ('admin','codex','staff','moderator','support')));
  end if;
end $$;

create table if not exists public.codex_chat_room (
  singleton boolean primary key default true check (singleton),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade
);
alter table public.codex_chat_room enable row level security;
revoke all on public.codex_chat_room from anon, authenticated;
grant select on public.codex_chat_room to authenticated;
drop policy if exists "members find shared chat room" on public.codex_chat_room;
create policy "members find shared chat room" on public.codex_chat_room
  for select to authenticated using (true);

insert into public.conversations (id, kind, title, created_by)
select '00000000-0000-4000-8000-000000000001'::uuid, 'customer', 'CODEX Community Chat', p.id
from public.profiles p where p.role = 'admin'
order by p.created_at limit 1
on conflict (id) do nothing;
update public.profiles p set chat_username = 'CODEX_Admin'
where p.role = 'admin' and p.chat_username is null
  and p.id = (select id from public.profiles where role = 'admin' order by created_at limit 1)
  and not exists (select 1 from public.profiles other where lower(other.chat_username) = 'codex_admin');
insert into public.codex_chat_room (singleton, conversation_id)
select true, '00000000-0000-4000-8000-000000000001'::uuid
where exists (select 1 from public.conversations where id = '00000000-0000-4000-8000-000000000001'::uuid)
on conflict (singleton) do update set conversation_id = excluded.conversation_id;
insert into public.conversation_members (conversation_id, user_id)
select r.conversation_id, p.id from public.codex_chat_room r cross join public.profiles p where p.role = 'admin'
on conflict do nothing;

alter table public.messages
  add column if not exists message_type text not null default 'text',
  add column if not exists media_path text,
  add column if not exists voice_duration_seconds integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'messages_chat_message_type') then
    alter table public.messages add constraint messages_chat_message_type
      check (message_type in ('text','voice'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_voice_note_fields') then
    alter table public.messages add constraint messages_voice_note_fields check (
      (message_type = 'text' and media_path is null and voice_duration_seconds is null)
      or (message_type = 'voice' and media_path is not null and voice_duration_seconds between 1 and 120)
    );
  end if;
end $$;

drop policy if exists "signed-in users start customer conversations" on public.conversations;
drop policy if exists "participants or admins view conversations" on public.conversations;
create policy "shared room members and admins view conversations" on public.conversations
  for select to authenticated using (
    (select private.is_codex_admin()) or
    ((select private.is_conversation_member(id)) and exists (
      select 1 from public.codex_chat_room r where r.conversation_id = id
    ))
  );
drop policy if exists "participants or admins view members" on public.conversation_members;
create policy "shared chat members view memberships" on public.conversation_members
  for select to authenticated using (
    (select private.is_codex_admin()) or
    ((select private.is_conversation_member(public.conversation_members.conversation_id)) and exists (
      select 1 from public.codex_chat_room r where r.conversation_id = public.conversation_members.conversation_id
    )) or user_id = (select auth.uid())
  );
drop policy if exists "admins assign conversation members" on public.conversation_members;
drop policy if exists "visitors join shared room with username" on public.conversation_members;
create policy "visitors join shared room with username" on public.conversation_members
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.codex_chat_room r where r.conversation_id = public.conversation_members.conversation_id
    ) and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
        and p.chat_username is not null and not p.chat_suspended
    )
  );

drop policy if exists "participants or admins view messages" on public.messages;
create policy "active shared room members and admins view messages" on public.messages
  for select to authenticated using (
    (select private.is_codex_admin()) or
    ((select private.is_conversation_member(conversation_id)) and exists (
      select 1 from public.codex_chat_room r where r.conversation_id = public.messages.conversation_id
    ) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and not p.chat_suspended))
  );
drop policy if exists "participants send messages as themselves" on public.messages;
drop policy if exists "admins send messages" on public.messages;
drop policy if exists "admins send shared room messages" on public.messages;
create policy "active members send to shared room" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and exists (
      select 1 from public.codex_chat_room r where r.conversation_id = public.messages.conversation_id
    ) and (select private.is_conversation_member(public.messages.conversation_id)) and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
        and p.chat_username is not null and not p.chat_suspended
    )
  );
create policy "admins send shared room messages" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and (select private.is_codex_admin()));
drop policy if exists "admins delete messages" on public.messages;
create policy "admins delete messages" on public.messages for delete to authenticated
  using ((select private.is_codex_admin()));

create or replace function public.codex_chat_members()
returns table(user_id uuid, chat_username text, role text, chat_suspended boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.chat_username, p.role::text, p.chat_suspended
  from public.profiles p join public.conversation_members cm on cm.user_id = p.id
  join public.codex_chat_room r on r.conversation_id = cm.conversation_id
  where (select private.is_codex_admin()) or (select private.is_conversation_member(r.conversation_id))
$$;
revoke all on function public.codex_chat_members() from public, anon;
grant execute on function public.codex_chat_members() to authenticated;

create or replace function public.codex_moderate_chat_member(target_user uuid, suspend_member boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.is_codex_admin()) then raise exception 'Administrator access required'; end if;
  if exists (select 1 from public.profiles where id = target_user and role = 'admin') then
    raise exception 'Administrator accounts cannot be suspended here';
  end if;
  update public.profiles set chat_suspended = suspend_member where id = target_user;
  if not found then raise exception 'Chat member not found'; end if;
end $$;
revoke all on function public.codex_moderate_chat_member(uuid, boolean) from public, anon;
grant execute on function public.codex_moderate_chat_member(uuid, boolean) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('codex-community-voice', 'codex-community-voice', false, 5242880,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/mp4; codecs=mp4a.40.2'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "chat members upload own voice notes" on storage.objects;
create policy "chat members upload own voice notes" on storage.objects for insert to authenticated
  with check (bucket_id = 'codex-community-voice'
    and (storage.foldername(name))[1] = '00000000-0000-4000-8000-000000000001'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (select private.is_conversation_member('00000000-0000-4000-8000-000000000001'::uuid))
    and exists (select 1 from public.profiles p where p.id = (select auth.uid())
      and p.chat_username is not null and not p.chat_suspended));
drop policy if exists "chat members read voice notes" on storage.objects;
create policy "chat members read voice notes" on storage.objects for select to authenticated
  using (bucket_id = 'codex-community-voice'
    and (storage.foldername(name))[1] = '00000000-0000-4000-8000-000000000001'
    and ((select private.is_codex_admin()) or
      ((select private.is_conversation_member('00000000-0000-4000-8000-000000000001'::uuid))
       and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and not p.chat_suspended))));
drop policy if exists "admins delete community voice notes" on storage.objects;
create policy "admins delete community voice notes" on storage.objects for delete to authenticated
  using (bucket_id = 'codex-community-voice' and (select private.is_codex_admin()));

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
