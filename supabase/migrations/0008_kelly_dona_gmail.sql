-- ============================================================================
-- Trudon ERP — Inclui o e-mail pessoal da Kelly como DONA do escritório.
-- Aplicar: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- Requer 0003 (permissões).
-- ----------------------------------------------------------------------------
-- IMPORTANTE: esta migration só define QUEM é dono. Ela NÃO cria a conta de
-- login nem confirma o e-mail. Se a Kelly não consegue entrar, primeiro
-- verifique no painel (Authentication → Users) se a conta existe e está
-- confirmada (ver instruções passadas no chat).
-- ============================================================================

create or replace function public.email_eh_dono(e text)
returns boolean
language sql immutable
as $$
  select lower(e) = any (array[
    'vinicius.bento@protonmail.com',     -- Vinícius (login atual)
    'vinicius.bento@trudon.com.br',      -- Vinícius (futuro e-mail corporativo)
    'kelly.picossi@trudon.com.br',       -- Kelly (futuro e-mail corporativo)
    'kelly.picossi@gmail.com'            -- Kelly (e-mail pessoal / acesso de testes)
  ]);
$$;

-- Promove a dona qualquer usuário JÁ existente cujo e-mail esteja na lista
-- (ex.: a conta de testes da Kelly, se já tiver sido criada no Auth).
update public.perfis p
   set dono = true
  from auth.users u
 where u.id = p.id
   and public.email_eh_dono(u.email);
