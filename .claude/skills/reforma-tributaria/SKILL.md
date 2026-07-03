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
- Alíquota teste desde janeiro/2026: CBS 0,9% +
  IBS 0,1% (total 1%), conforme LC 214/2025.
  São tributos DISTINTOS — guias de recolhimento
  e destinação separadas (CBS federal; IBS
  estados/municípios) — e o app deve tratá-los
  como dois tributos, nunca como "1%" único.
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

## MEI — Regras de teto e desenquadramento
(verificado em jul/2026)

- Teto vigente: R$ 81.000/ano (sem reajuste
  desde 2018). NÃO foi alterado pela LC
  214/2025. Projetos em tramitação (PLP
  186/2026: R$ 110 mil em 2027, R$ 140 mil em
  2028) ainda sem aprovação — implementar o
  teto SEMPRE como parâmetro configurável em
  tabelas.ts, nunca como constante fixa.

- Faixas de excesso (implementar alertas em
  3 níveis, não 2):
  1. Aproximação: acima de 80% do teto → aviso
  2. Excesso até 20% (até R$ 97.200): DAS
     complementar + desenquadramento para ME
     em janeiro do ano seguinte, sem multa
  3. Excesso acima de 20%: desenquadramento
     RETROATIVO a janeiro do próprio ano, com
     juros e multas — cenário crítico, alerta
     máximo

- Resolução CGSN 183/2025: rendimentos da
  mesma atividade econômica recebidos no CPF
  do titular somam ao faturamento do CNPJ
  para fins de limite. O cadastro/lançamentos
  do ERP precisam permitir capturar receita
  em CPF vinculada ao MEI.

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
