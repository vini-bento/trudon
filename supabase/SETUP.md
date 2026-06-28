# Trudon IA — Setup (Supabase + Anthropic)

A Trudon IA usa **Supabase Auth** (login restrito) + uma **Edge Function** que
conversa com a **Claude (Anthropic)**. A chave da Anthropic vive **só no
servidor** (Secrets do Supabase), nunca no navegador.

> Enquanto a função não estiver publicada, a Trudon IA continua funcionando no
> **modo offline** (cérebro baseado em regras). Depois do deploy + chave, ela
> passa a responder com a Claude.

## 1. Chave da Anthropic (uma vez)

1. Crie a conta/credito em **https://console.anthropic.com** → Billing → adicione créditos.
2. **API Keys → Create Key** e copie a chave (`sk-ant-...`).

## 2. Publicar a Edge Function

### Opção A — pelo painel do Supabase (sem instalar nada)

1. Supabase → **Edge Functions** → **Create a function**.
2. Nome: **`trudon-ia`**.
3. Cole o conteúdo de `supabase/functions/trudon-ia/index.ts` e clique em **Deploy**.

### Opção B — pela CLI

```bash
npm i -g supabase
supabase login
supabase link --project-ref eyttthsbuqapjklagnlr
supabase functions deploy trudon-ia
```

## 3. Cadastrar a chave como Secret

- Supabase → **Edge Functions → Secrets** (ou Project Settings → Edge Functions):
  crie **`ANTHROPIC_API_KEY`** = a chave do passo 1.
- (Opcional) **`TRUDON_IA_MODEL`** para trocar o modelo (padrão `claude-sonnet-4-6`;
  ex.: `claude-haiku-4-5` para mais barato, `claude-opus-4-8` para o mais capaz).

## 4. Restringir o acesso (você, Kelly, +autorizados)

- **Authentication → Providers → Email**: habilitado.
- **Authentication → (Sign In / Providers ou Settings)**: **desligue** o cadastro
  público (*Allow new users to sign up* / *Enable signups*).
- **Authentication → Users → Add user**: crie os usuários autorizados (você, Kelly).
  Defina a senha na criação (ou envie convite por e-mail).

Pronto: no app, o botão **Trudon IA** pede login; só os usuários cadastrados
entram, e as respostas passam a vir da Claude.
