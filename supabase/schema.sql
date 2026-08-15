-- Fonte única de identidade: auth.users. Execute no projeto Supabase.
-- O trigger mantém public.profiles sincronizado sem expor qualquer chave admin.

alter table public.profiles
  add column if not exists avatar text default 'panther' not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_check
      check (avatar in ('panther', 'fox', 'panda', 'wolf', 'lion', 'owl', 'alien', 'robot'));
  end if;
end
$$;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, accepted_terms, accepted_terms_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, ''), '@', 1), 'Usuário'),
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'accepted_terms')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'accepted_terms')::boolean, false) then now() else null end
  )
  on conflict (id) do update set
    nome = excluded.nome,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.categories add constraint categories_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.expenses add constraint expenses_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.incomes add constraint incomes_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.cards add constraint cards_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.card_invoices_payments add constraint card_invoices_payments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.goals add constraint goals_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.plans add constraint plans_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.plan_contributions add constraint plan_contributions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.thresholds add constraint thresholds_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.chat_messages add constraint chat_messages_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.pluggy_items add constraint pluggy_items_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.pluggy_accounts add constraint pluggy_accounts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.invite_codes add constraint invite_codes_created_by_fkey foreign key (created_by) references public.profiles(id) on delete cascade;
alter table public.invite_codes add constraint invite_codes_used_by_fkey foreign key (used_by) references public.profiles(id) on delete set null;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.cards enable row level security;
alter table public.card_invoices_payments enable row level security;
alter table public.goals enable row level security;
alter table public.plans enable row level security;
alter table public.plan_contributions enable row level security;
alter table public.thresholds enable row level security;
alter table public.chat_messages enable row level security;
alter table public.pluggy_items enable row level security;
alter table public.pluggy_accounts enable row level security;
alter table public.pluggy_webhook_events enable row level security;
alter table public.invite_codes enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on table public.pluggy_webhook_events from anon, authenticated;
revoke all on sequence public.pluggy_webhook_events_id_seq from anon, authenticated;

create policy "profile owner manages profile" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "categories belong to user" on public.categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "expenses belong to user" on public.expenses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "incomes belong to user" on public.incomes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cards belong to user" on public.cards for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "invoice payments belong to user" on public.card_invoices_payments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals belong to user" on public.goals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "plans belong to user" on public.plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "plan contributions belong to user" on public.plan_contributions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "thresholds belong to user" on public.thresholds for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chat messages belong to user" on public.chat_messages for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "pluggy items belong to user" on public.pluggy_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "pluggy accounts belong to user" on public.pluggy_accounts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "invite codes creator manages codes" on public.invite_codes for all to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);
