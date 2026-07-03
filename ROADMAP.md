# ROADMAP — Trudon ERP

Baseado na auditoria fiscal de julho/2026
(análise da skill reforma-tributaria).

## 🔴 Prioridade 1 — Correção urgente
- [ ] Validação de teto MEI (R$ 81.000/ano) em
  apurarMEI(): alertas de desenquadramento em
  3 níveis (aproximação >80%, excesso até 20%,
  excesso acima de 20% com efeito retroativo)
  - Ver skill: seção "MEI — Regras de teto e
    desenquadramento" em
    .claude/skills/reforma-tributaria/SKILL.md
  - Nota: teto em discussão legislativa
    (PLP 186/2026) — implementar como parâmetro
    configurável, não como constante fixa no
    código

## 🟠 Prioridade 2 — Lacunas de negócio
(especificar com Kelly antes de implementar)
- [ ] IRPF como regime: cálculo de IRPF e
  carnê-leão inexistentes no motor fiscal
- [ ] Categorias de serviço faltantes: cobrança
  por evento (societário), sazonal PF e
  consultoria avulsa — hoje só existe contrato
  mensal fixo (Contrato/Cobranca)
- [ ] Módulo de folha de pagamento (Nível 2):
  cadastro individual de funcionários (CPF,
  admissão, cargo, salário, categoria), cálculo
  de encargos e eventos eSocial. Pré-requisito:
  quadro de pessoal por categoria (implementado).
  Decisão pendente com Kelly: escopo e prioridade.

## 🟡 Prioridade 3 — Conformidade com a reforma
(LC 214/2025, por ordem de prazo)
- [ ] Janela de opção do Simples Nacional:
  lógica de prazo para set/2026
- [ ] CBS 0,9% + IBS 0,1% (fase de teste 2026):
  cálculo e exibição nos regimes aplicáveis
- [ ] CNPJ Técnico: preparar cadastro de
  Empresa PF para exigência de jan/2027
- [ ] Nanoempreendedor: isenção IBS/CBS para
  receita < 50% do teto MEI (depende da
  validação de teto da Prioridade 1)

## Referências
- Skill: .claude/skills/reforma-tributaria/
- Regras de processo: test-driven-development
  e verification-before-completion para todo
  item fiscal deste roadmap
