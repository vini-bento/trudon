# Trudon — Inteligência Contábil (ERP)

ERP web para o escritório de contabilidade **Trudon**. Projeto sério, com dados
sensíveis de clientes (LGPD). Referências de ambição: **Domínio Max** e
**Alterdata**. Marca: dourado + grafite.

## Princípio inegociável: correção sem achismo

Este app calcula tributos e folha de pagamento. **Um erro pode fazer o cliente
sonegar sem saber e custar o CRC da contadora.** Por isso, toda funcionalidade
que envolve cálculo segue esta disciplina (mesmo padrão dos módulos Fiscal e
Folha já prontos):

1. **Tabelas oficiais com a fonte citada** no código (lei/portaria), nunca
   números soltos. Centralizadas em arquivos `tabelas.ts`.
2. **Funções puras + testes automatizados** (`vitest`) conferindo cada cálculo
   contra exemplos resolvidos à mão / exemplos oficiais.
3. **Memória de cálculo visível na tela** (passo a passo) para conferência
   humana antes de transmitir/recolher.
4. **Honestidade de escopo**: o app *apura e gera valores conferíveis*; a
   *transmissão oficial* (eSocial, SPED, DCTFWeb, emissão de guia) é camada à
   parte / integração futura. Nunca prometer transmissão automática que não
   existe.
5. **Sem chute**: quando faltar um número oficial, marcar claramente e pedir a
   fonte — não inventar.

## Stack

- React 18 + TypeScript + Vite 5 + Tailwind 3. **HashRouter** (funciona em host
  estático / GitHub Pages).
- Estado: **Zustand** com persist em localStorage (`src/store/useStore.ts`).
  Sendo migrado progressivamente para o Supabase como fonte da verdade.
- Charts: Recharts. Ícones: lucide-react. Datas: date-fns. Testes: Vitest.
- **Supabase**: Auth (e-mail/senha, signup público desabilitado), Postgres + RLS,
  Edge Functions (Trudon IA → Claude). Migrations em `supabase/migrations/`.
- Deploy: branch **gh-pages** (Source = "Deploy from a branch"). NÃO via Actions.

## Comandos

```bash
npm run test     # vitest (deve ficar 100% verde)
npm run build    # tsc --noEmit && vite build
npm run dev      # servidor local
```

Deploy (após build): copiar `dist/` para a branch `gh-pages` (via git worktree),
adicionar `404.html` (cópia do index) e `.nojekyll`, commit e push.

## Convenções

- Código e UI em **português**. Comentários explicam o "porquê", não o óbvio.
- Componentes de entrada reutilizáveis em `src/components/ui/index.tsx`:
  - `MoedaInput` — campo R$ com máscara automática (1.234,56), guarda número.
  - `DocumentoInput` — CPF/CNPJ/RG com máscara automática, guarda só dígitos.
- Para verificar UI: o `App.tsx` é envolto por `AuthGate`. Para tirar
  screenshot sem login, troque temporariamente por `<RouterProvider/>` direto e
  **restaure depois com Edit (não `git checkout`, que apaga rotas novas)**.

## Arquitetura de domínio (resumo)

- `src/data/types.ts` — tipos centrais. `Empresa` = o CLIENTE (PF ou PJ).
- `src/lib/fiscal/` — motor fiscal (ver STATUS.md).
- `src/lib/folha/` — motor de folha / DP (ver STATUS.md).
- `src/pages/` — uma página por módulo.
- Empresa é o centro: Fiscal, Folha, Contabilidade e Obrigações se conectam a
  partir dela.

## Branch de trabalho

Desenvolver sempre em **`claude/accounting-app-review-qffa5p`**. Commitar e dar
push ao concluir cada etapa. Acesso de GitHub limitado ao repo `vini-bento/trudon`.

> **Estado atual e roadmap detalhado: ver `STATUS.md`.**
