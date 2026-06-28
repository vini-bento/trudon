-- ============================================================================
-- Trudon ERP — Fatia 2: Honorários (contratos + cobranças)
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer a migração 0001 (empresas/perfis/funções eh_equipe/empresa_do_cliente).
-- ============================================================================

create table if not exists public.contratos (
  id             text primary key,
  empresa_id     text not null references public.empresas (id) on delete cascade,
  descricao      text not null,
  valor_mensal   numeric(14,2) not null default 0,
  dia_vencimento int not null default 5,
  ativo          boolean not null default true,
  inicio_em      date,
  criado_em      timestamptz not null default now()
);

create table if not exists public.cobrancas (
  id           text primary key,
  empresa_id   text not null references public.empresas (id) on delete cascade,
  contrato_id  text references public.contratos (id) on delete set null,
  competencia  text not null,
  vencimento   date,
  valor        numeric(14,2) not null default 0,
  status       text not null default 'Pendente' check (status in ('Pago','Pendente','Atrasado')),
  pago_em      date,
  criado_em    timestamptz not null default now()
);

create index if not exists idx_contratos_empresa on public.contratos (empresa_id);
create index if not exists idx_cobrancas_empresa on public.cobrancas (empresa_id);

-- RLS: equipe acessa tudo; cliente só LÊ os registros da própria empresa.
alter table public.contratos enable row level security;
alter table public.cobrancas enable row level security;

drop policy if exists contratos_equipe_all on public.contratos;
create policy contratos_equipe_all on public.contratos
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
drop policy if exists contratos_cliente_select on public.contratos;
create policy contratos_cliente_select on public.contratos
  for select to authenticated using (empresa_id = public.empresa_do_cliente());

drop policy if exists cobrancas_equipe_all on public.cobrancas;
create policy cobrancas_equipe_all on public.cobrancas
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
drop policy if exists cobrancas_cliente_select on public.cobrancas;
create policy cobrancas_cliente_select on public.cobrancas
  for select to authenticated using (empresa_id = public.empresa_do_cliente());

-- SEED (gerado a partir dos dados de exemplo do app) -------------------------
-- contratos
insert into public.contratos (id, empresa_id, descricao, valor_mensal, dia_vencimento, ativo, inicio_em) values
  ('c-e1', 'e1', 'Honorários contábeis — Aurora Tech', 2800, 5, true, '2018-03-12'),
  ('c-e2', 'e2', 'Honorários contábeis — Belluno Mercado', 1450, 10, true, '2015-07-01'),
  ('c-e3', 'e3', 'Honorários contábeis — Horizonte Engenharia', 6200, 15, true, '2009-11-20'),
  ('c-e4', 'e4', 'Honorários contábeis — Vida Plena', 2100, 20, true, '2017-02-14'),
  ('c-e5', 'e5', 'Honorários contábeis — JP Transportes', 980, 5, true, '2020-09-05'),
  ('c-e6', 'e6', 'Honorários contábeis — Marés Hotel', 2400, 10, true, '2012-05-30'),
  ('c-e7', 'e7', 'Honorários contábeis — Verde Vale', 7800, 15, true, '2006-01-18'),
  ('c-e8', 'e8', 'Honorários contábeis — Pixel Studio', 1250, 20, true, '2021-08-22'),
  ('c-e9', 'e9', 'Honorários contábeis — Materiais do Antônio', 320, 5, true, '2022-04-10')
on conflict (id) do nothing;

-- cobrancas
insert into public.cobrancas (id, empresa_id, contrato_id, competencia, vencimento, valor, status, pago_em) values
  ('cob-e1-2026-01', 'e1', 'c-e1', '2026-01', '2026-01-05', 2800, 'Atrasado', null),
  ('cob-e1-2026-02', 'e1', 'c-e1', '2026-02', '2026-02-05', 2800, 'Pago', '2026-02-07'),
  ('cob-e1-2026-03', 'e1', 'c-e1', '2026-03', '2026-03-05', 2800, 'Pago', '2026-03-06'),
  ('cob-e1-2026-04', 'e1', 'c-e1', '2026-04', '2026-04-05', 2800, 'Pago', '2026-04-08'),
  ('cob-e1-2026-05', 'e1', 'c-e1', '2026-05', '2026-05-05', 2800, 'Pago', '2026-05-07'),
  ('cob-e1-2026-06', 'e1', 'c-e1', '2026-06', '2026-06-05', 2800, 'Pendente', null),
  ('cob-e2-2026-01', 'e2', 'c-e2', '2026-01', '2026-01-10', 1450, 'Pago', '2026-01-12'),
  ('cob-e2-2026-02', 'e2', 'c-e2', '2026-02', '2026-02-10', 1450, 'Pago', '2026-02-13'),
  ('cob-e2-2026-03', 'e2', 'c-e2', '2026-03', '2026-03-10', 1450, 'Pago', '2026-03-11'),
  ('cob-e2-2026-04', 'e2', 'c-e2', '2026-04', '2026-04-10', 1450, 'Pago', '2026-04-12'),
  ('cob-e2-2026-05', 'e2', 'c-e2', '2026-05', '2026-05-10', 1450, 'Pago', '2026-05-10'),
  ('cob-e2-2026-06', 'e2', 'c-e2', '2026-06', '2026-06-10', 1450, 'Pendente', null),
  ('cob-e3-2026-01', 'e3', 'c-e3', '2026-01', '2026-01-15', 6200, 'Pago', '2026-01-19'),
  ('cob-e3-2026-02', 'e3', 'c-e3', '2026-02', '2026-02-15', 6200, 'Pago', '2026-02-16'),
  ('cob-e3-2026-03', 'e3', 'c-e3', '2026-03', '2026-03-15', 6200, 'Atrasado', null),
  ('cob-e3-2026-04', 'e3', 'c-e3', '2026-04', '2026-04-15', 6200, 'Atrasado', null),
  ('cob-e3-2026-05', 'e3', 'c-e3', '2026-05', '2026-05-15', 6200, 'Pago', '2026-05-18'),
  ('cob-e3-2026-06', 'e3', 'c-e3', '2026-06', '2026-06-15', 6200, 'Pago', '2026-06-13'),
  ('cob-e4-2026-01', 'e4', 'c-e4', '2026-01', '2026-01-20', 2100, 'Pago', '2026-01-24'),
  ('cob-e4-2026-02', 'e4', 'c-e4', '2026-02', '2026-02-20', 2100, 'Pago', '2026-02-22'),
  ('cob-e4-2026-03', 'e4', 'c-e4', '2026-03', '2026-03-20', 2100, 'Pago', '2026-03-22'),
  ('cob-e4-2026-04', 'e4', 'c-e4', '2026-04', '2026-04-20', 2100, 'Pago', '2026-04-22'),
  ('cob-e4-2026-05', 'e4', 'c-e4', '2026-05', '2026-05-20', 2100, 'Pago', '2026-05-23'),
  ('cob-e4-2026-06', 'e4', 'c-e4', '2026-06', '2026-06-20', 2100, 'Pendente', null),
  ('cob-e5-2026-01', 'e5', 'c-e5', '2026-01', '2026-01-05', 980, 'Pago', '2026-01-08'),
  ('cob-e5-2026-02', 'e5', 'c-e5', '2026-02', '2026-02-05', 980, 'Atrasado', null),
  ('cob-e5-2026-03', 'e5', 'c-e5', '2026-03', '2026-03-05', 980, 'Pago', '2026-03-08'),
  ('cob-e5-2026-04', 'e5', 'c-e5', '2026-04', '2026-04-05', 980, 'Pago', '2026-04-08'),
  ('cob-e5-2026-05', 'e5', 'c-e5', '2026-05', '2026-05-05', 980, 'Pago', '2026-05-09'),
  ('cob-e5-2026-06', 'e5', 'c-e5', '2026-06', '2026-06-05', 980, 'Pendente', null),
  ('cob-e6-2026-01', 'e6', 'c-e6', '2026-01', '2026-01-10', 2400, 'Pago', '2026-01-11'),
  ('cob-e6-2026-02', 'e6', 'c-e6', '2026-02', '2026-02-10', 2400, 'Atrasado', null),
  ('cob-e6-2026-03', 'e6', 'c-e6', '2026-03', '2026-03-10', 2400, 'Pago', '2026-03-13'),
  ('cob-e6-2026-04', 'e6', 'c-e6', '2026-04', '2026-04-10', 2400, 'Pago', '2026-04-10'),
  ('cob-e6-2026-05', 'e6', 'c-e6', '2026-05', '2026-05-10', 2400, 'Pago', '2026-05-14'),
  ('cob-e6-2026-06', 'e6', 'c-e6', '2026-06', '2026-06-10', 2400, 'Pendente', null),
  ('cob-e7-2026-01', 'e7', 'c-e7', '2026-01', '2026-01-15', 7800, 'Pago', '2026-01-18'),
  ('cob-e7-2026-02', 'e7', 'c-e7', '2026-02', '2026-02-15', 7800, 'Pago', '2026-02-15'),
  ('cob-e7-2026-03', 'e7', 'c-e7', '2026-03', '2026-03-15', 7800, 'Atrasado', null),
  ('cob-e7-2026-04', 'e7', 'c-e7', '2026-04', '2026-04-15', 7800, 'Atrasado', null),
  ('cob-e7-2026-05', 'e7', 'c-e7', '2026-05', '2026-05-15', 7800, 'Atrasado', null),
  ('cob-e7-2026-06', 'e7', 'c-e7', '2026-06', '2026-06-15', 7800, 'Pendente', null),
  ('cob-e8-2026-01', 'e8', 'c-e8', '2026-01', '2026-01-20', 1250, 'Pago', '2026-01-22'),
  ('cob-e8-2026-02', 'e8', 'c-e8', '2026-02', '2026-02-20', 1250, 'Pago', '2026-02-20'),
  ('cob-e8-2026-03', 'e8', 'c-e8', '2026-03', '2026-03-20', 1250, 'Pago', '2026-03-22'),
  ('cob-e8-2026-04', 'e8', 'c-e8', '2026-04', '2026-04-20', 1250, 'Atrasado', null),
  ('cob-e8-2026-05', 'e8', 'c-e8', '2026-05', '2026-05-20', 1250, 'Atrasado', null),
  ('cob-e8-2026-06', 'e8', 'c-e8', '2026-06', '2026-06-20', 1250, 'Pago', '2026-06-18'),
  ('cob-e9-2026-01', 'e9', 'c-e9', '2026-01', '2026-01-05', 320, 'Pago', '2026-01-08'),
  ('cob-e9-2026-02', 'e9', 'c-e9', '2026-02', '2026-02-05', 320, 'Pago', '2026-02-05'),
  ('cob-e9-2026-03', 'e9', 'c-e9', '2026-03', '2026-03-05', 320, 'Pago', '2026-03-07'),
  ('cob-e9-2026-04', 'e9', 'c-e9', '2026-04', '2026-04-05', 320, 'Pago', '2026-04-07'),
  ('cob-e9-2026-05', 'e9', 'c-e9', '2026-05', '2026-05-05', 320, 'Pago', '2026-05-06'),
  ('cob-e9-2026-06', 'e9', 'c-e9', '2026-06', '2026-06-05', 320, 'Pago', '2026-06-03')
on conflict (id) do nothing;
