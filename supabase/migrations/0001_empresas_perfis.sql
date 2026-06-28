-- ============================================================================
-- Trudon ERP — Fatia 1: tabelas `empresas` e `perfis` + segurança (RLS)
-- ----------------------------------------------------------------------------
-- Como aplicar: Supabase → SQL Editor → cole tudo → Run.
-- Seguro de rodar mais de uma vez (usa IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- 1) EMPRESAS ----------------------------------------------------------------
-- id é TEXT (não UUID) de propósito: preserva os ids do app (e1..e9) para que
-- os dados dependentes (lançamentos, honorários, etc.) continuem casando quando
-- forem migrados nas próximas fatias.
create table if not exists public.empresas (
  id             text primary key,
  razao_social   text not null,
  nome_fantasia  text not null,
  cnpj           text not null,
  regime         text not null,
  situacao       text not null default 'Ativa',
  segmento       text,
  cidade         text,
  uf             text,
  abertura_em    date,
  email          text,
  telefone       text,
  responsavel_id text,
  socios         jsonb not null default '[]'::jsonb,
  criado_em      timestamptz not null default now()
);

-- 2) PERFIS ------------------------------------------------------------------
-- Liga cada LOGIN (auth.users) a um papel e, no caso de cliente, a uma empresa.
create table if not exists public.perfis (
  id          uuid primary key references auth.users (id) on delete cascade,
  papel       text not null default 'equipe' check (papel in ('equipe','cliente')),
  empresa_id  text references public.empresas (id) on delete set null,
  nome        text,
  criado_em   timestamptz not null default now()
);

-- Cria automaticamente um perfil quando um novo login é criado.
-- Padrão 'equipe' (clientes serão criados pela equipe com papel 'cliente').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: o usuário atual é da equipe?
create or replace function public.eh_equipe()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'equipe'
  );
$$;

-- Helper: empresa do cliente atual (null se for equipe).
create or replace function public.empresa_do_cliente()
returns text
language sql
stable security definer set search_path = public
as $$
  select empresa_id from public.perfis where id = auth.uid();
$$;

-- 3) RLS ---------------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.perfis   enable row level security;

-- PERFIS: cada um lê o próprio perfil; equipe lê todos.
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.eh_equipe());

-- EMPRESAS:
--  • equipe: acesso total (ler e editar).
--  • cliente: apenas LÊ a própria empresa (sem edição). [base p/ a próxima fatia]
drop policy if exists empresas_equipe_all on public.empresas;
create policy empresas_equipe_all on public.empresas
  for all to authenticated
  using (public.eh_equipe())
  with check (public.eh_equipe());

drop policy if exists empresas_cliente_select on public.empresas;
create policy empresas_cliente_select on public.empresas
  for select to authenticated
  using (id = public.empresa_do_cliente());

-- 4) SEED (empresas de exemplo) ---------------------------------------------
insert into public.empresas
  (id, razao_social, nome_fantasia, cnpj, regime, situacao, segmento, cidade, uf, abertura_em, email, telefone, responsavel_id, socios)
values
  ('e1','Aurora Tecnologia e Sistemas Ltda','Aurora Tech','12345678000190','Lucro Presumido','Ativa','Tecnologia','São Paulo','SP','2018-03-12','financeiro@auroratech.com.br','11987654321','u2','[{"nome":"Daniel Prado","cpf":"11122233396","participacao":60},{"nome":"Marina Prado","cpf":"22233344407","participacao":40}]'),
  ('e2','Belluno Comércio de Alimentos Ltda','Belluno Mercado','23456789000181','Simples Nacional','Ativa','Comércio','Campinas','SP','2015-07-01','contato@belluno.com.br','19988776655','u2','[{"nome":"Giuseppe Belluno","cpf":"33344455518","participacao":100}]'),
  ('e3','Construtora Horizonte S/A','Horizonte Engenharia','34567890000172','Lucro Real','Ativa','Construção Civil','Rio de Janeiro','RJ','2009-11-20','fiscal@horizonteeng.com.br','21997654321','u3','[{"nome":"Eduardo Castro","cpf":"44455566629","participacao":50},{"nome":"Patrícia Mendes","cpf":"55566677730","participacao":50}]'),
  ('e4','Clínica Vida Plena Ltda','Vida Plena','45678901000163','Lucro Presumido','Ativa','Saúde','Belo Horizonte','MG','2017-02-14','adm@vidaplena.com.br','31988112233','u2','[{"nome":"Dra. Sônia Vasconcelos","cpf":"66677788841","participacao":100}]'),
  ('e5','Joaquim Pereira Transportes ME','JP Transportes','56789012000154','Simples Nacional','Ativa','Transporte','Curitiba','PR','2020-09-05','jp@jptransportes.com.br','41999887766','u3','[{"nome":"Joaquim Pereira","cpf":"77788899952","participacao":100}]'),
  ('e6','Marés Turismo e Hotelaria Ltda','Marés Hotel','67890123000145','Lucro Presumido','Suspensa','Turismo','Florianópolis','SC','2012-05-30','reservas@mareshotel.com.br','48988443322','u2','[{"nome":"Roberto Maré","cpf":"88899900063","participacao":70},{"nome":"Lúcia Maré","cpf":"99900011174","participacao":30}]'),
  ('e7','Verde Vale Agronegócios S/A','Verde Vale','78901234000136','Lucro Real','Ativa','Agronegócio','Ribeirão Preto','SP','2006-01-18','controladoria@verdevale.agr.br','16997112244','u3','[{"nome":"Fernando Tavares","cpf":"10111213145","participacao":100}]'),
  ('e8','Studio Criativo Pixel Ltda','Pixel Studio','89012345000127','Simples Nacional','Ativa','Publicidade','Porto Alegre','RS','2021-08-22','ola@pixelstudio.com.br','51988556677','u2','[{"nome":"Tatiana Reis","cpf":"12131415156","participacao":50},{"nome":"Bruno Reis","cpf":"13141516167","participacao":50}]'),
  ('e9','Antônio Comércio de Materiais MEI','Materiais do Antônio','90123456000118','MEI','Ativa','Comércio','Salvador','BA','2022-04-10','antonio.materiais@gmail.com','71988009911','u3','[{"nome":"Antônio Carlos Silva","cpf":"14151617178","participacao":100}]')
on conflict (id) do nothing;
