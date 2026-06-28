-- ============================================================================
-- Trudon ERP — Estrutura de permissões da equipe
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (perfis) e 0002 (honorários).
-- ----------------------------------------------------------------------------
-- Modelo:
--   • dono = true  → você e a Kelly: acesso TOTAL, ignora qualquer restrição.
--   • cargo        → ponto de partida (rótulo), ex.: Contador, Fiscal, Pessoal.
--   • permissoes   → áreas que o membro pode ver (ajustadas pelos donos, pessoa
--                    a pessoa). Ex.: {'honorarios','folha','fiscal'}.
-- Só DONOS alteram perfis (cargos/permissões) — garantido por RLS.
-- ============================================================================

alter table public.perfis add column if not exists dono       boolean   not null default false;
alter table public.perfis add column if not exists cargo      text;
alter table public.perfis add column if not exists permissoes text[]    not null default '{}';

-- ----------------------------------------------------------------------------
-- LISTA DE DONOS (edite aqui).
-- Quem estiver nesta lista vira dono automaticamente — agora, se já existir, e
-- no momento em que se cadastrar (ex.: a Kelly, que ainda não tem conta).
-- 👉 Acrescente também o SEU e-mail de login do Supabase, se ainda não estiver.
-- ----------------------------------------------------------------------------
create or replace function public.email_eh_dono(e text)
returns boolean
language sql immutable
as $$
  select lower(e) = any (array[
    'kelly.picossi@trudon.com.br'
    -- , 'seu-email-de-login@exemplo.com'   -- ← adicione o seu aqui
  ]);
$$;

-- Cria o perfil no cadastro de um novo login, já marcando dono pela lista acima.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome, dono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    public.email_eh_dono(new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers de permissão
create or replace function public.eh_dono()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select dono from public.perfis where id = auth.uid()), false);
$$;

create or replace function public.tem_permissao(chave text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.eh_dono()
      or coalesce(
           (select chave = any(permissoes) from public.perfis where id = auth.uid()),
           false
         );
$$;

-- Só donos podem alterar/criar/remover perfis (impede auto-promoção).
drop policy if exists perfis_dono_update on public.perfis;
create policy perfis_dono_update on public.perfis
  for update to authenticated using (public.eh_dono()) with check (public.eh_dono());
drop policy if exists perfis_dono_insert on public.perfis;
create policy perfis_dono_insert on public.perfis
  for insert to authenticated with check (public.eh_dono());
drop policy if exists perfis_dono_delete on public.perfis;
create policy perfis_dono_delete on public.perfis
  for delete to authenticated using (public.eh_dono());

-- HONORÁRIOS passa a exigir a permissão 'honorarios' (donos têm automático).
drop policy if exists contratos_equipe_all on public.contratos;
create policy contratos_equipe_all on public.contratos
  for all to authenticated
  using (public.tem_permissao('honorarios')) with check (public.tem_permissao('honorarios'));
drop policy if exists cobrancas_equipe_all on public.cobrancas;
create policy cobrancas_equipe_all on public.cobrancas
  for all to authenticated
  using (public.tem_permissao('honorarios')) with check (public.tem_permissao('honorarios'));

-- Aplica a regra aos usuários que JÁ existem (ex.: você, agora).
update public.perfis p
   set dono = true
  from auth.users u
 where u.id = p.id
   and public.email_eh_dono(u.email);
