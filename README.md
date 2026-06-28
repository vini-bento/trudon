# Trudon ERP — Inteligência Contábil

Plataforma de gestão para escritórios de contabilidade, com a identidade da
Trudon e a **Trudon IA** integrada. Esta é a **fase 1**: uma aplicação web
totalmente funcional, construída como fundação sólida para evoluir, com
segurança, para um ambiente de produção com dados reais.

> ⚠️ **Dados fictícios.** Todo o conteúdo é gerado para demonstração e fica
> apenas no navegador (localStorage). Nenhum dado real de cliente deve ser
> inserido antes da fase de blindagem (autenticação, criptografia, auditoria e
> adequação à LGPD).

## Módulos

| Módulo | O que faz |
|---|---|
| **Dashboard** | Indicadores em tempo real, insights da Trudon IA, fluxo de honorários e distribuição por regime. |
| **Empresas** | Carteira de clientes: cadastro, edição, busca, filtros e detalhes com sócios. |
| **Contabilidade** | Escrituração por empresa, **balancete que fecha** (partidas dobradas), DRE e lançamentos. |
| **Honorários** | Faturamento, recebíveis, inadimplência, fluxo orçado × realizado e baixa de cobranças. |
| **Obrigações** | Calendário de entregas (DAS, DCTFWeb, eSocial, FGTS…), filtros e controle de status. |
| **Portal do Cliente** | Documentos publicados com protocolo eletrônico e controle de visualização. |
| **Trudon IA** | Assistente contábil que responde, com base nos dados do escritório, sobre clientes, honorários, obrigações e resultado. |

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (tema dourado + grafite da marca)
- **Zustand** com persistência em localStorage
- **Recharts** (gráficos) · **lucide-react** (ícones) · **date-fns**
- **Vitest** + Testing Library (testes das regras críticas)

## Como rodar

```bash
npm install
npm run dev        # ambiente de desenvolvimento
npm run test       # testes (contabilidade, formatação)
npm run build      # build de produção (typecheck + bundle)
npm run preview    # serve o build localmente
```

## Arquitetura (preparada para a fase 2)

- `src/lib/` — regras puras e testadas (contabilidade, finanças, formatação).
- `src/data/` — modelo de domínio e dados-semente.
- `src/store/` — estado e **camada de persistência isolada**: na fase de
  produção, basta trocar o `persist` por uma API segura, sem mexer na UI.
- `src/features/ia/` — motor da Trudon IA com **ponto de integração** pronto:
  hoje responde localmente (ideal para dados sensíveis); pode ser ligado à API
  da Claude (Anthropic) sem expor chaves no cliente.

## Trudon IA

A Trudon IA é o diferencial do produto. Nesta fase ela funciona com um motor
baseado em regras sobre os dados reais do app — sem enviar nada para fora. O
módulo já está desenhado para, na fase de produção, conectar-se a um modelo de
linguagem (Claude) mantendo a mesma interface.
