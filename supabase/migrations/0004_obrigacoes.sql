-- ============================================================================
-- Trudon ERP — Fatia 3: Obrigações (agenda de entregas)
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (empresas/perfis/funções).
-- ============================================================================

create table if not exists public.obrigacoes (
  id             text primary key,
  empresa_id     text not null references public.empresas (id) on delete cascade,
  titulo         text not null,
  tipo           text not null,
  competencia    text not null,
  vencimento     date,
  status         text not null default 'Pendente'
                 check (status in ('Pendente','Em andamento','Concluída','Atrasada')),
  responsavel_id text,
  departamento   text,
  concluida_em   date,
  criado_em      timestamptz not null default now()
);

create index if not exists idx_obrigacoes_empresa on public.obrigacoes (empresa_id);

-- RLS: equipe acessa tudo; cliente só LÊ as obrigações da própria empresa.
alter table public.obrigacoes enable row level security;

drop policy if exists obrigacoes_equipe_all on public.obrigacoes;
create policy obrigacoes_equipe_all on public.obrigacoes
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists obrigacoes_cliente_select on public.obrigacoes;
create policy obrigacoes_cliente_select on public.obrigacoes
  for select to authenticated using (empresa_id = public.empresa_do_cliente());

-- SEED (gerado a partir dos dados de exemplo do app) -------------------------
insert into public.obrigacoes (id, empresa_id, titulo, tipo, competencia, vencimento, status, responsavel_id, departamento, concluida_em) values
  ('ob-e1-0', 'e1', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Fiscal', '2026-06-19'),
  ('ob-e1-1', 'e1', 'DCTFWeb', 'Fiscal', '2026-06', '2026-06-15', 'Concluída', 'u2', 'Fiscal', '2026-06-14'),
  ('ob-e1-2', 'e1', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Atrasada', 'u2', 'Pessoal', null),
  ('ob-e1-3', 'e1', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Atrasada', 'u2', 'Pessoal', null),
  ('ob-e1-4', 'e1', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Concluída', 'u2', 'Contábil', '2026-06-24'),
  ('ob-e1-5', 'e1', 'EFD-Contribuições (PIS/COFINS)', 'Fiscal', '2026-06', '2026-06-14', 'Concluída', 'u2', 'Fiscal', '2026-06-13'),
  ('ob-e2-0', 'e2', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Fiscal', '2026-06-19'),
  ('ob-e2-1', 'e2', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u2', 'Pessoal', '2026-06-14'),
  ('ob-e2-2', 'e2', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Atrasada', 'u2', 'Pessoal', null),
  ('ob-e2-3', 'e2', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Atrasada', 'u2', 'Contábil', null),
  ('ob-e3-0', 'e3', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Fiscal', '2026-06-19'),
  ('ob-e3-1', 'e3', 'DCTFWeb', 'Fiscal', '2026-06', '2026-06-15', 'Concluída', 'u3', 'Fiscal', '2026-06-14'),
  ('ob-e3-2', 'e3', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u3', 'Pessoal', '2026-06-14'),
  ('ob-e3-3', 'e3', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Pessoal', '2026-06-19'),
  ('ob-e3-4', 'e3', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Concluída', 'u3', 'Contábil', '2026-06-24'),
  ('ob-e3-5', 'e3', 'EFD-Contribuições (PIS/COFINS)', 'Fiscal', '2026-06', '2026-06-14', 'Concluída', 'u3', 'Fiscal', '2026-06-13'),
  ('ob-e4-0', 'e4', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Fiscal', '2026-06-19'),
  ('ob-e4-1', 'e4', 'DCTFWeb', 'Fiscal', '2026-06', '2026-06-15', 'Atrasada', 'u2', 'Fiscal', null),
  ('ob-e4-2', 'e4', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u2', 'Pessoal', '2026-06-14'),
  ('ob-e4-3', 'e4', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Pessoal', '2026-06-19'),
  ('ob-e4-4', 'e4', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Atrasada', 'u2', 'Contábil', null),
  ('ob-e4-5', 'e4', 'EFD-Contribuições (PIS/COFINS)', 'Fiscal', '2026-06', '2026-06-14', 'Concluída', 'u2', 'Fiscal', '2026-06-13'),
  ('ob-e5-0', 'e5', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Fiscal', '2026-06-19'),
  ('ob-e5-1', 'e5', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u3', 'Pessoal', '2026-06-14'),
  ('ob-e5-2', 'e5', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Atrasada', 'u3', 'Pessoal', null),
  ('ob-e5-3', 'e5', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Concluída', 'u3', 'Contábil', '2026-06-24'),
  ('ob-e7-0', 'e7', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Fiscal', '2026-06-19'),
  ('ob-e7-1', 'e7', 'DCTFWeb', 'Fiscal', '2026-06', '2026-06-15', 'Concluída', 'u3', 'Fiscal', '2026-06-14'),
  ('ob-e7-2', 'e7', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u3', 'Pessoal', '2026-06-14'),
  ('ob-e7-3', 'e7', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Pessoal', '2026-06-19'),
  ('ob-e7-4', 'e7', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Atrasada', 'u3', 'Contábil', null),
  ('ob-e7-5', 'e7', 'EFD-Contribuições (PIS/COFINS)', 'Fiscal', '2026-06', '2026-06-14', 'Concluída', 'u3', 'Fiscal', '2026-06-13'),
  ('ob-e8-0', 'e8', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Fiscal', '2026-06-19'),
  ('ob-e8-1', 'e8', 'eSocial — Folha de Pagamento', 'Trabalhista', '2026-06', '2026-06-15', 'Concluída', 'u2', 'Pessoal', '2026-06-14'),
  ('ob-e8-2', 'e8', 'FGTS Digital', 'Trabalhista', '2026-06', '2026-06-20', 'Concluída', 'u2', 'Pessoal', '2026-06-19'),
  ('ob-e8-3', 'e8', 'Escrituração Contábil do mês', 'Contábil', '2026-06', '2026-06-25', 'Concluída', 'u2', 'Contábil', '2026-06-24'),
  ('ob-e9-0', 'e9', 'Apuração e DAS — Simples Nacional', 'Fiscal', '2026-06', '2026-06-20', 'Concluída', 'u3', 'Fiscal', '2026-06-19')
on conflict (id) do nothing;
