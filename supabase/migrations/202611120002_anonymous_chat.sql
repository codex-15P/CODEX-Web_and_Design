-- Allow anonymous website visitors to start customer chats without exposing
-- conversation or message tables to the unauthenticated browser role.
-- Visitors use temporary Supabase Auth identities, so existing RLS policies
-- can restrict every chat to its creator and the CODEX administrators.

-- Anonymous temporary users may chat, but they cannot post comments or
-- reactions as an unverified identity.
drop policy if exists "users create own reactions on published projects"
  on public.project_reactions;
drop policy if exists "permanent users create own reactions on published projects"
  on public.project_reactions;
create policy "permanent users create own reactions on published projects"
  on public.project_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

drop policy if exists "users change own reactions on published projects"
  on public.project_reactions;
drop policy if exists "permanent users change own reactions on published projects"
  on public.project_reactions;
create policy "permanent users change own reactions on published projects"
  on public.project_reactions for update to authenticated
  using (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

drop policy if exists "users remove own reactions" on public.project_reactions;
drop policy if exists "permanent users or admins remove reactions"
  on public.project_reactions;
create policy "permanent users or admins remove reactions"
  on public.project_reactions for delete to authenticated
  using (
    (user_id = (select auth.uid())
     and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
    or (select private.is_codex_admin())
  );

drop policy if exists "signed-in users submit comments for review"
  on public.project_comments;
drop policy if exists "permanent users submit comments for review"
  on public.project_comments;
create policy "permanent users submit comments for review"
  on public.project_comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and status = 'pending'
    and moderated_by is null
    and moderated_at is null
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

drop policy if exists "users edit own pending comments" on public.project_comments;
drop policy if exists "permanent users edit own pending comments"
  on public.project_comments;
create policy "permanent users edit own pending comments"
  on public.project_comments for update to authenticated
  using (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and status = 'pending'
  )
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and status = 'pending'
    and moderated_by is null
    and moderated_at is null
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

-- Administrators can reply to conversations created by anonymous visitors.
drop policy if exists "admins send messages" on public.messages;
create policy "admins send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select private.is_codex_admin())
  );

-- Keep the inbox ordered by the latest message.
create or replace function private.bump_conversation_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation_activity on public.messages;
create trigger messages_bump_conversation_activity
  after insert on public.messages
  for each row execute function private.bump_conversation_activity();

-- Publish only the rows needed for private, RLS-filtered chat updates.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'conversations'
    ) then
      execute 'alter publication supabase_realtime add table public.conversations';
    end if;
  end if;
end;
$$;
