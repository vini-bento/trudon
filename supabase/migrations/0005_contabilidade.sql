-- ============================================================================
-- Trudon ERP — Fatia 4: Contabilidade (lançamentos)
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (empresas/perfis/funções).
-- O plano de contas é fixo no app (compartilhado), por isso não vira tabela.
-- ============================================================================

create table if not exists public.lancamentos (
  id               text primary key,
  empresa_id       text not null references public.empresas (id) on delete cascade,
  data             date not null,
  historico        text not null,
  conta_debito_id  text not null,
  conta_credito_id text not null,
  valor            numeric(14,2) not null default 0,
  centro_custo     text,
  criado_em        timestamptz not null default now()
);

create index if not exists idx_lancamentos_empresa on public.lancamentos (empresa_id);

-- RLS: equipe acessa tudo; cliente só LÊ os lançamentos da própria empresa.
alter table public.lancamentos enable row level security;

drop policy if exists lancamentos_equipe_all on public.lancamentos;
create policy lancamentos_equipe_all on public.lancamentos
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists lancamentos_cliente_select on public.lancamentos;
create policy lancamentos_cliente_select on public.lancamentos
  for select to authenticated using (empresa_id = public.empresa_do_cliente());

-- SEED (gerado a partir dos dados de exemplo do app) -------------------------
insert into public.lancamentos (id, empresa_id, data, historico, conta_debito_id, conta_credito_id, valor, centro_custo) values
  ('e1-l1', 'e1', '2026-06-22', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 21556.75, 'Administrativo'),
  ('e1-l2', 'e1', '2026-06-23', 'Vendas à vista', 'caixa', 'receita-vendas', 10884.7, 'Operacional'),
  ('e1-l3', 'e1', '2026-06-12', 'Faturamento a prazo', 'clientes', 'receita-servicos', 9706.84, 'Administrativo'),
  ('e1-l4', 'e1', '2026-06-03', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 13779.37, 'Operacional'),
  ('e1-l5', 'e1', '2026-06-19', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 7072.4, 'Administrativo'),
  ('e1-l6', 'e1', '2026-06-05', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 4707.33, 'Operacional'),
  ('e1-l7', 'e1', '2026-06-14', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 9576.55, 'Administrativo'),
  ('e1-l8', 'e1', '2026-06-02', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 3343.31, 'Operacional'),
  ('e1-l9', 'e1', '2026-06-09', 'Liquidação de duplicatas', 'banco', 'clientes', 7319.58, 'Administrativo'),
  ('e2-l1', 'e2', '2026-06-07', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 15670.57, 'Administrativo'),
  ('e2-l2', 'e2', '2026-06-09', 'Vendas à vista', 'caixa', 'receita-vendas', 8127.71, 'Operacional'),
  ('e2-l3', 'e2', '2026-06-26', 'Faturamento a prazo', 'clientes', 'receita-servicos', 13541.71, 'Administrativo'),
  ('e2-l4', 'e2', '2026-06-23', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 15938.31, 'Operacional'),
  ('e2-l5', 'e2', '2026-06-10', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 6831.9, 'Administrativo'),
  ('e2-l6', 'e2', '2026-06-03', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 3687.26, 'Operacional'),
  ('e2-l7', 'e2', '2026-06-14', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 8708.12, 'Administrativo'),
  ('e2-l8', 'e2', '2026-06-18', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 3792.99, 'Operacional'),
  ('e2-l9', 'e2', '2026-06-12', 'Liquidação de duplicatas', 'banco', 'clientes', 8648.57, 'Administrativo'),
  ('e3-l1', 'e3', '2026-06-14', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 73211.68, 'Administrativo'),
  ('e3-l2', 'e3', '2026-06-11', 'Vendas à vista', 'caixa', 'receita-vendas', 38303.15, 'Operacional'),
  ('e3-l3', 'e3', '2026-06-16', 'Faturamento a prazo', 'clientes', 'receita-servicos', 50366.99, 'Administrativo'),
  ('e3-l4', 'e3', '2026-06-05', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 56430.56, 'Operacional'),
  ('e3-l5', 'e3', '2026-06-03', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 29761.98, 'Administrativo'),
  ('e3-l6', 'e3', '2026-06-11', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 20434.16, 'Operacional'),
  ('e3-l7', 'e3', '2026-06-22', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 25086.22, 'Administrativo'),
  ('e3-l8', 'e3', '2026-06-10', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 11879.06, 'Operacional'),
  ('e3-l9', 'e3', '2026-06-01', 'Liquidação de duplicatas', 'banco', 'clientes', 28842.01, 'Administrativo'),
  ('e4-l1', 'e4', '2026-06-06', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 17405.24, 'Administrativo'),
  ('e4-l2', 'e4', '2026-06-25', 'Vendas à vista', 'caixa', 'receita-vendas', 11964.61, 'Operacional'),
  ('e4-l3', 'e4', '2026-06-23', 'Faturamento a prazo', 'clientes', 'receita-servicos', 12842.72, 'Administrativo'),
  ('e4-l4', 'e4', '2026-06-26', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 14680.61, 'Operacional'),
  ('e4-l5', 'e4', '2026-06-04', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 7751.15, 'Administrativo'),
  ('e4-l6', 'e4', '2026-06-25', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 4033.12, 'Operacional'),
  ('e4-l7', 'e4', '2026-06-05', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 7729.17, 'Administrativo'),
  ('e4-l8', 'e4', '2026-06-26', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 3987.2, 'Operacional'),
  ('e4-l9', 'e4', '2026-06-11', 'Liquidação de duplicatas', 'banco', 'clientes', 7065.1, 'Administrativo'),
  ('e5-l1', 'e5', '2026-06-08', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 15978.67, 'Administrativo'),
  ('e5-l2', 'e5', '2026-06-17', 'Vendas à vista', 'caixa', 'receita-vendas', 9818.06, 'Operacional'),
  ('e5-l3', 'e5', '2026-06-01', 'Faturamento a prazo', 'clientes', 'receita-servicos', 12929.61, 'Administrativo'),
  ('e5-l4', 'e5', '2026-06-17', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 15641.94, 'Operacional'),
  ('e5-l5', 'e5', '2026-06-22', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 5919.25, 'Administrativo'),
  ('e5-l6', 'e5', '2026-06-24', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 3889.33, 'Operacional'),
  ('e5-l7', 'e5', '2026-06-09', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 6246.66, 'Administrativo'),
  ('e5-l8', 'e5', '2026-06-03', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 3557.41, 'Operacional'),
  ('e5-l9', 'e5', '2026-06-14', 'Liquidação de duplicatas', 'banco', 'clientes', 7169.09, 'Administrativo'),
  ('e6-l1', 'e6', '2026-06-18', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 18165.53, 'Administrativo'),
  ('e6-l2', 'e6', '2026-06-15', 'Vendas à vista', 'caixa', 'receita-vendas', 10197.4, 'Operacional'),
  ('e6-l3', 'e6', '2026-06-09', 'Faturamento a prazo', 'clientes', 'receita-servicos', 13765.46, 'Administrativo'),
  ('e7-l1', 'e7', '2026-06-06', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 70292.07, 'Administrativo'),
  ('e7-l2', 'e7', '2026-06-26', 'Vendas à vista', 'caixa', 'receita-vendas', 48123.24, 'Operacional'),
  ('e7-l3', 'e7', '2026-06-26', 'Faturamento a prazo', 'clientes', 'receita-servicos', 59560.53, 'Administrativo'),
  ('e7-l4', 'e7', '2026-06-11', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 52070, 'Operacional'),
  ('e7-l5', 'e7', '2026-06-07', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 24437.59, 'Administrativo'),
  ('e7-l6', 'e7', '2026-06-23', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 16472.45, 'Operacional'),
  ('e7-l7', 'e7', '2026-06-20', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 26748.11, 'Administrativo'),
  ('e7-l8', 'e7', '2026-06-16', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 15962.75, 'Operacional'),
  ('e7-l9', 'e7', '2026-06-16', 'Liquidação de duplicatas', 'banco', 'clientes', 27114.3, 'Administrativo'),
  ('e8-l1', 'e8', '2026-06-07', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 22239.42, 'Administrativo'),
  ('e8-l2', 'e8', '2026-06-12', 'Vendas à vista', 'caixa', 'receita-vendas', 8071.12, 'Operacional'),
  ('e8-l3', 'e8', '2026-06-02', 'Faturamento a prazo', 'clientes', 'receita-servicos', 10544.03, 'Administrativo'),
  ('e8-l4', 'e8', '2026-06-16', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 11792.14, 'Operacional'),
  ('e8-l5', 'e8', '2026-06-21', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 4840.33, 'Administrativo'),
  ('e8-l6', 'e8', '2026-06-05', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 3537.45, 'Operacional'),
  ('e8-l7', 'e8', '2026-06-22', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 9903.11, 'Administrativo'),
  ('e8-l8', 'e8', '2026-06-23', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 3389.76, 'Operacional'),
  ('e8-l9', 'e8', '2026-06-15', 'Liquidação de duplicatas', 'banco', 'clientes', 10019.49, 'Administrativo'),
  ('e9-l1', 'e9', '2026-06-19', 'Recebimento de serviços prestados', 'banco', 'receita-servicos', 3199.52, 'Administrativo'),
  ('e9-l2', 'e9', '2026-06-23', 'Vendas à vista', 'caixa', 'receita-vendas', 1496.75, 'Operacional'),
  ('e9-l3', 'e9', '2026-06-16', 'Faturamento a prazo', 'clientes', 'receita-servicos', 1853.75, 'Administrativo'),
  ('e9-l4', 'e9', '2026-06-10', 'Provisão de folha de salários', 'desp-salarios', 'salarios-pagar', 1900.82, 'Operacional'),
  ('e9-l5', 'e9', '2026-06-10', 'Pagamento de aluguel', 'desp-aluguel', 'banco', 1117.6, 'Administrativo'),
  ('e9-l6', 'e9', '2026-06-21', 'Apuração de impostos do mês', 'desp-impostos', 'impostos-pagar', 707.05, 'Operacional'),
  ('e9-l7', 'e9', '2026-06-02', 'Compra de mercadorias/insumos', 'desp-fornecedores', 'fornecedores', 1068.49, 'Administrativo'),
  ('e9-l8', 'e9', '2026-06-24', 'Despesas administrativas diversas', 'desp-gerais', 'banco', 551.1, 'Operacional'),
  ('e9-l9', 'e9', '2026-06-10', 'Liquidação de duplicatas', 'banco', 'clientes', 1312.42, 'Administrativo')
on conflict (id) do nothing;
