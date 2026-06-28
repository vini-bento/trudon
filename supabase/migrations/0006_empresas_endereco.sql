-- ============================================================================
-- Trudon ERP — Endereço completo das empresas
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (tabela empresas).
-- ============================================================================

alter table public.empresas add column if not exists cep         text;
alter table public.empresas add column if not exists logradouro  text;
alter table public.empresas add column if not exists numero      text;
alter table public.empresas add column if not exists complemento text;
alter table public.empresas add column if not exists bairro      text;

-- Preenche o endereço das empresas de exemplo já cadastradas.
update public.empresas as e set
  cep = v.cep, logradouro = v.logradouro, numero = v.numero,
  complemento = v.complemento, bairro = v.bairro
from (values
  ('e1','01310-100','Avenida Paulista','1578','Conj. 142','Bela Vista'),
  ('e2','13010-111','Rua Conceição','233','Loja 2','Centro'),
  ('e3','20040-002','Avenida Rio Branco','156','Sala 2010','Centro'),
  ('e4','30130-009','Avenida Afonso Pena','1500','Sala 304','Centro'),
  ('e5','81450-000','Rua Eduardo Sprada','3210','Galpão 4','Campo Comprido'),
  ('e6','88015-200','Avenida Beira-Mar Norte','2800','','Centro'),
  ('e7','14025-000','Rodovia Anhanguera, km 312','s/n','Bloco A','Jardim Califórnia'),
  ('e8','90420-060','Rua Padre Chagas','415','Sala 12','Moinhos de Vento'),
  ('e9','40070-110','Avenida Sete de Setembro','99','Loja 1','Centro')
) as v(id, cep, logradouro, numero, complemento, bairro)
where e.id = v.id;
