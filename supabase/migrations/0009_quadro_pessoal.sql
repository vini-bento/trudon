-- ============================================================================
-- Trudon ERP — Quadro de pessoal (contagem de vínculos por categoria)
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (empresas/perfis/funções eh_equipe/empresa_do_cliente).
--
-- Entidade PRÓPRIA (não colunas na tabela empresas), de propósito: no futuro
-- evolui para cadastro individual de funcionários sem migração dolorosa —
-- basta acrescentar colunas/uma tabela filha, sem mexer em `empresas`.
-- ============================================================================

create table if not exists public.quadro_pessoal (
  id          text primary key,
  empresa_id  text not null references public.empresas (id) on delete cascade,
  categoria   text not null check (categoria in (
                'clt','pro_labore','estagiario','jovem_aprendiz','autonomo_rpa','domestico'
              )),
  quantidade  int not null default 0 check (quantidade >= 0),
  criado_em   timestamptz not null default now(),
  -- Uma linha por empresa+categoria: permite upsert por (empresa_id, categoria).
  unique (empresa_id, categoria)
);

create index if not exists idx_quadro_pessoal_empresa on public.quadro_pessoal (empresa_id);

-- RLS: equipe acessa tudo; cliente só LÊ o próprio quadro (mesmo padrão das
-- demais tabelas — contratos, cobrancas, obrigacoes).
alter table public.quadro_pessoal enable row level security;

drop policy if exists quadro_pessoal_equipe_all on public.quadro_pessoal;
create policy quadro_pessoal_equipe_all on public.quadro_pessoal
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists quadro_pessoal_cliente_select on public.quadro_pessoal;
create policy quadro_pessoal_cliente_select on public.quadro_pessoal
  for select to authenticated using (empresa_id = public.empresa_do_cliente());
