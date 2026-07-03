---
name: design-trudon-erp
description: >
  Use when creating or modifying ANY interface,
  component, or visual element in this ERP.
  Defines the mandatory design language.
  Complements (and overrides, in conflicts)
  the frontend-design skill.
---

# Linguagem visual — Trudon ERP

Inspiração: design industrial de Jonathan Ive.
Princípio central: clareza através de
hierarquia, não através de vazio. Um ERP é
denso por natureza; a sofisticação está em
organizar densidade, nunca em escondê-la.

## Regras
- Reduzir até doer: cada elemento na tela
  precisa justificar sua existência. Sem
  ornamento, sem sombras decorativas, sem
  gradientes chamativos, sem ícones supérfluos.
- Paleta quase monocromática: fundos neutros
  (branco/cinza-claro), texto em tons de
  grafite, e UMA cor de acento usada com
  extrema parcimônia (ações primárias e
  estados críticos apenas). Alertas fiscais:
  vermelho/âmbar somente quando funcionais.
- Tipografia é a interface: hierarquia feita
  com peso e tamanho, não com caixas e bordas.
  Números tabulares (tabular-nums) em toda
  coluna de valores — alinhamento perfeito de
  cifras é inegociável num app contábil.
- Espaço em branco é material de construção:
  margens generosas e consistentes (escala de
  8px), agrupamento por proximidade em vez de
  linhas divisórias sempre que possível.
- Movimento discreto e físico: transições
  curtas (150-250ms, ease-out), nada de
  animações decorativas. O movimento explica
  (de onde veio, para onde foi), nunca enfeita.
- Cantos e superfícies: raios de borda
  contidos e uniformes, uma única elevação
  sutil para elementos flutuantes. Nada de
  camadas de sombra empilhadas.
- Estados vazios e erros: tratados com o mesmo
  cuidado do caminho feliz — texto claro,
  próxima ação óbvia, zero ilustrações
  genéricas.

## Teste final
Antes de entregar qualquer tela, perguntar:
"O que posso REMOVER sem perder função?"
Remover. Repetir.
