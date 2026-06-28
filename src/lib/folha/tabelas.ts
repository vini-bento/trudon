// ============================================================================
// Tabelas oficiais da Folha de Pagamento — fonte da verdade do motor.
// ----------------------------------------------------------------------------
// REGRA DE OURO (igual ao módulo Fiscal): nenhum número que afeta o salário do
// trabalhador fica solto no código. Tudo vive aqui, com a fonte citada, e é
// coberto por testes automatizados (ver folha.test.ts).
//
// INSS: Portaria Interministerial MPS/MF nº 13/2026 (vigente desde 01/01/2026).
// IRRF: Lei 15.270/2025 + tabela progressiva vigente (base maio/2024).
// ============================================================================

// Parâmetros gerais de 2026
export const SALARIO_MINIMO = 1_621.0; // referência 2026
export const TETO_INSS = 8_475.55; // teto do salário de contribuição

// ----------------------------------------------------------------------------
// INSS — desconto do empregado (tabela progressiva por faixas).
// Método com parcela a deduzir: INSS = salário × alíquota − parcela a deduzir,
// respeitando o teto. Valores conferidos contra a Portaria MPS/MF nº 13/2026.
// ----------------------------------------------------------------------------
export interface FaixaINSS {
  ate: number; // limite superior da faixa
  aliquota: number; // %
  deduzir: number; // parcela a deduzir em R$
}

export const faixasINSS: FaixaINSS[] = [
  { ate: 1_621.0, aliquota: 7.5, deduzir: 0 },
  { ate: 2_902.84, aliquota: 9.0, deduzir: 24.32 },
  { ate: 4_354.27, aliquota: 12.0, deduzir: 111.4 },
  { ate: TETO_INSS, aliquota: 14.0, deduzir: 198.5 },
];

// ----------------------------------------------------------------------------
// IRRF — Imposto de Renda Retido na Fonte (mensal).
// Tabela progressiva vigente (base maio/2024) — alíquotas e parcela a deduzir.
// ----------------------------------------------------------------------------
export interface FaixaIRRF {
  ate: number; // limite superior da base de cálculo
  aliquota: number; // %
  deduzir: number; // parcela a deduzir em R$
}

export const faixasIRRF: FaixaIRRF[] = [
  { ate: 2_259.2, aliquota: 0, deduzir: 0 },
  { ate: 2_826.65, aliquota: 7.5, deduzir: 169.44 },
  { ate: 3_751.05, aliquota: 15, deduzir: 381.44 },
  { ate: 4_664.68, aliquota: 22.5, deduzir: 662.77 },
  { ate: Infinity, aliquota: 27.5, deduzir: 896.0 },
];

export const DEDUCAO_DEPENDENTE = 189.59; // por dependente/mês
export const DESCONTO_SIMPLIFICADO = 607.2; // desconto simplificado mensal (2026)

// ATENÇÃO — REDUTOR DA LEI 15.270/2025 (NOVO EM 2026, A VALIDAR):
// A Receita Federal instituiu um redutor mensal do IRRF que torna isentos os
// rendimentos até R$ 5.000 e reduz de forma decrescente até R$ 7.350.
// A página oficial não pôde ser lida automaticamente; os valores abaixo seguem
// a orientação amplamente divulgada da Receita (dez/2025) e DEVEM ser validados
// pelo responsável técnico contra a tabela oficial antes do uso em folha real.
export const IRRF_REDUTOR_PENDENTE_VALIDACAO = true;
export const IRRF_ISENCAO_TOTAL_ATE = 5_000.0; // até aqui: IRRF zero
export const IRRF_REDUCAO_PARCIAL_ATE = 7_350.0; // acima disso: sem redutor
export const IRRF_REDUTOR_FORMULA_A = 978.62; // redutor = A − B × rendimento
export const IRRF_REDUTOR_FORMULA_B = 0.133145;

// ----------------------------------------------------------------------------
// FGTS — depósito do empregador (não desconta do empregado).
// ----------------------------------------------------------------------------
export const FGTS_PADRAO = 0.08; // 8% — regra geral
export const FGTS_APRENDIZ = 0.02; // 2% — contrato de aprendizagem (Lei 10.097)

// ----------------------------------------------------------------------------
// Encargos patronais (custo da empresa, fora do Simples Anexos I–III/V).
// ----------------------------------------------------------------------------
export const CPP_PATRONAL = 0.2; // 20% — contribuição previdenciária patronal
export const TERCEIROS_PADRAO = 0.058; // 5,8% — Sistema S (varia por FPAS)
export const RAT_PADRAO = 0.02; // 1%–3% × FAP — informado por empresa (padrão 2%)

// ----------------------------------------------------------------------------
// Adicionais (percentuais padrão CLT; ajustáveis por convenção coletiva).
// ----------------------------------------------------------------------------
export const ADICIONAL_NOTURNO = 0.2; // +20% sobre a hora (22h–5h)
export const HORA_EXTRA_50 = 0.5; // +50% (dias úteis)
export const HORA_EXTRA_100 = 1.0; // +100% (domingos e feriados)
export const PERICULOSIDADE = 0.3; // +30% sobre o salário base
export const INSALUBRIDADE_GRAUS = { minimo: 0.1, medio: 0.2, maximo: 0.4 }; // sobre o salário mínimo
export const VALE_TRANSPORTE_DESCONTO_MAX = 0.06; // até 6% do salário base
export const HORAS_MES_PADRAO = 220; // jornada mensal padrão (44h/semana)
