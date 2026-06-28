-- ============================================================================
-- Trudon ERP — Cadastro completo de cliente (PF/PJ, contatos, gov, bancário)
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0001 (empresas).
-- ============================================================================

alter table public.empresas add column if not exists tipo_pessoa          text not null default 'PJ';
alter table public.empresas add column if not exists inscricao_estadual   text;
alter table public.empresas add column if not exists isento_ie            boolean not null default false;
alter table public.empresas add column if not exists inscricao_municipal  text;
alter table public.empresas add column if not exists cnae                 text;
alter table public.empresas add column if not exists natureza_juridica    text;
-- Pessoa Física
alter table public.empresas add column if not exists cpf                  text;
alter table public.empresas add column if not exists rg                   text;
alter table public.empresas add column if not exists orgao_emissor        text;
alter table public.empresas add column if not exists data_nascimento      date;
alter table public.empresas add column if not exists profissao            text;
-- Contatos
alter table public.empresas add column if not exists contatos             jsonb not null default '[]'::jsonb;
-- Acessos governamentais (preparados)
alter table public.empresas add column if not exists certificado_tipo     text;
alter table public.empresas add column if not exists certificado_validade date;
alter table public.empresas add column if not exists ecac_validade        date;
-- Dados bancários
alter table public.empresas add column if not exists banco_codigo         text;
alter table public.empresas add column if not exists agencia              text;
alter table public.empresas add column if not exists conta                text;
alter table public.empresas add column if not exists tipo_conta           text;
alter table public.empresas add column if not exists pix                  text;
-- Observações
alter table public.empresas add column if not exists observacoes          text;

-- Deriva um contato principal a partir do e-mail/telefone já cadastrados,
-- para as empresas que ainda não têm contatos.
update public.empresas
   set contatos = jsonb_build_array(
         jsonb_build_object(
           'nome', 'Contato principal',
           'cargo', 'Financeiro',
           'email', coalesce(email, ''),
           'telefone', coalesce(telefone, ''),
           'principal', true
         )
       )
 where contatos is null or contatos = '[]'::jsonb;
