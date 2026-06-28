-- ============================================================================
-- Trudon ERP — Estrutura de permissões da equipe
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (perfis) e 0002 (honorários).
-- ----------------------------------------------------------------------------
-- Modelo:
--   • dono = true  → você e a Kelly: acesso TOTAL, ignora qualquer restrição.
--   • cargo        → ponto de partida (rótulo), ex.: Contador, Fiscal, Pessoal.
--   • permissoes   → lista de áreas que o membro pode ver (ajustada pelos donos
--                    pessoa a pessoa). Ex.: {'honorarios','folha','fiscal'}.
-- Só DONOS podem alterar perfis (cargos/permissões) — garantido por RLS.
-- ============================================================================

alter table public.perfis add column if not exists dono       boolean   not null default false;
alter table public.perfis add column if not exists cargo      text;
alter table public.perfis add column if not exists permissoes text[]    not null default '{}';

-- É dono?
create or replace function public.eh_dono()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select dono from public.perfis where id = auth.uid()), false);
$$;

-- Tem permissão para uma área sensível? (dono sempre tem)
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

-- ----------------------------------------------------------------------------
-- HONORÁRIOS passa a exigir permissão 'honorarios' (além de ser equipe).
-- Donos têm acesso automático; demais membros, só com a permissão marcada.
-- ----------------------------------------------------------------------------
drop policy if exists contratos_equipe_all on public.contratos;
create policy contratos_equipe_all on public.contratos
  for all to authenticated
  using (public.tem_permissao('honorarios'))
  with check (public.tem_permissao('honorarios'));

drop policy if exists cobrancas_equipe_all on public.cobrancas;
create policy cobrancas_equipe_all on public.cobrancas
  for all to authenticated
  using (public.tem_permissao('honorarios'))
  with check (public.tem_permissao('honorarios'));

-- ----------------------------------------------------------------------------
-- Marcar os DONOS.
-- Como hoje só existem os sócios, marcamos todos os usuários atuais como donos.
-- (Novos membros entram como NÃO-donos por padrão.)
-- ----------------------------------------------------------------------------
update public.perfis set dono = true;

-- Para promover alguém a dono no futuro, use o e-mail:
-- update public.perfis set dono = true
--   where id = (select id from auth.users where email = 'kelly@trudon.com.br');
