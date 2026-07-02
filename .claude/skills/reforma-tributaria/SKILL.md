---
name: reforma-tributaria
description: >
  Use when working on any tax calculation, rate,
  or fiscal rule in this ERP. Contains current
  Brazilian tax reform rules (LC 214/2025) that
  the app must comply with. Do NOT use for UI
  or non-fiscal code.
---

# Reforma Tributária — Regras Vigentes

## CBS/IBS
- Alíquota teste: 1% desde janeiro/2026
- CBS plena: implementação a partir de 2027

### O que o app implementa hoje (jul/2026)
**Nada da reforma ainda.** Não há nenhuma referência
a CBS, IBS, alíquota teste ou LC 214/2025 no código.
O motor fiscal (`src/lib/fiscal/`) apura apenas o
sistema anterior à reforma:
- `simples.ts` — `apurarSimples()` (DAS, alíquota
  efetiva por RBT12, Fator R via `fatorR()`) e
  `apurarMEI()` (DAS-SIMEI fixo)
- `presumido.ts` — `apurarPresumido()` (IRPJ/CSLL
  trimestrais por presunção, PIS/COFINS cumulativos,
  ISS com alíquota informada)
- `real.ts` — `apurarReal()` (IRPJ/CSLL sobre base
  informada, PIS/COFINS não-cumulativos)
- `tabelas.ts` — fonte única de alíquotas, com a
  base legal citada em comentário (padrão do projeto:
  nenhum número fiscal solto no código)

Quando CBS/IBS forem implementados, as alíquotas
devem entrar em `tabelas.ts` com fonte citada e
testes em `fiscal.test.ts`, seguindo o CLAUDE.md.

## Categorias especiais
- Nanoempreendedor: receita anual abaixo de 50%
  do teto MEI (~R$40.500), isento de IBS/CBS
- CNPJ Técnico: exigência de CNPJ para
  contribuintes individuais de IBS/CBS,
  obrigatório a partir de janeiro/2027

## Contexto do escritório (TRUDON)
Serviços em quatro categorias:
1. Constituição e alterações societárias
   (cobradas por evento)
2. Recorrentes PJ mensais (honorários fixos)
3. Sazonais/ocasionais PF (IRPF, carnê-leão)
4. Consultoria e regularização (parcelamento,
   certidões, planejamento tributário)

Regimes atendidos: MEI, Simples Nacional,
Lucro Presumido e IRPF.
Janela de opção do Simples Nacional: set/2026.

### Como o app trata isso hoje (jul/2026)
- **Regimes**: o tipo `RegimeTributario`
  (`src/data/types.ts`) aceita `Simples Nacional`,
  `Lucro Presumido`, `Lucro Real` e `MEI`. IRPF
  **não** existe como regime; clientes PF são
  modelados via `Empresa.tipoPessoa = 'PF'`.
- **Cálculo por regime**: cada regime tem sua
  função de apuração em `src/lib/fiscal/` (ver
  seção CBS/IBS acima). Não há cálculo de IRPF
  nem de carnê-leão no código.
- **Categorias de serviço**: as quatro categorias
  do escritório não são modeladas. A cobrança de
  honorários usa apenas `Contrato` (com
  `valorMensal` fixo e `diaVencimento`) e
  `Cobranca` mensal (`src/data/types.ts`,
  `src/lib/honorariosApi.ts`) — ou seja, só a
  categoria 2 (recorrentes PJ) tem suporte real.
  Cobranças por evento (categoria 1), sazonais PF
  (categoria 3) e consultoria avulsa (categoria 4)
  não têm entidade própria.
- **Janela do Simples set/2026**: nenhuma lógica
  de prazo/opção existe; o módulo de obrigações
  (`Obrigacao` em `src/data/types.ts`) permite
  cadastrar o prazo manualmente.

## Fontes primárias
- LC 214/2025
- Portais oficiais da Receita Federal

## Regra de ouro
Antes de alterar qualquer base de cálculo,
verificar se a regra neste arquivo ainda está
vigente. A legislação está em regulamentação
ativa — em caso de dúvida, buscar a fonte
primária na web antes de implementar.
