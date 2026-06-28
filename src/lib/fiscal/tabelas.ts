// ============================================================================
// Tabelas oficiais de tributação — fonte da verdade do motor fiscal.
// ----------------------------------------------------------------------------
// REGRA DE OURO: nenhum número fiscal é "solto" no código. Tudo o que define
// quanto um cliente paga vive AQUI, com a fonte legal citada, e é coberto por
// testes automatizados (ver fiscal.test.ts). Assim, qualquer alteração de
// alíquota passa por um único lugar, auditável.
//
// Simples Nacional: Anexos I a V da Lei Complementar nº 123/2006 (redação da
// LC 155/2016, vigente desde 2018). Valores conferidos contra as tabelas
// oficiais da Receita Federal (normas.receita.fazenda.gov.br).
// ============================================================================

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface FaixaSimples {
  faixa: number; // 1 a 6
  ate: number; // limite superior da Receita Bruta em 12 meses (RBT12), em R$
  aliquota: number; // alíquota nominal, em % (ex.: 4 = 4,00%)
  deduzir: number; // parcela a deduzir, em R$
}

// Limite geral do Simples Nacional (RBT12) — LC 123/2006, art. 3º, II.
export const LIMITE_SIMPLES = 4_800_000;

// Percentual do Fator R: folha de 12 meses / receita de 12 meses.
// >= 28% tributa pelo Anexo III; < 28% pelo Anexo V (LC 123/2006, art. 18, §5º-J/M).
export const FATOR_R_LIMITE = 0.28;

// As 6 faixas de cada anexo. `ate` é o teto da faixa; a 1ª começa em 0.
export const tabelasSimples: Record<AnexoSimples, FaixaSimples[]> = {
  // ANEXO I — Comércio
  I: [
    { faixa: 1, ate: 180_000, aliquota: 4.0, deduzir: 0 },
    { faixa: 2, ate: 360_000, aliquota: 7.3, deduzir: 5_940 },
    { faixa: 3, ate: 720_000, aliquota: 9.5, deduzir: 13_860 },
    { faixa: 4, ate: 1_800_000, aliquota: 10.7, deduzir: 22_500 },
    { faixa: 5, ate: 3_600_000, aliquota: 14.3, deduzir: 87_300 },
    { faixa: 6, ate: 4_800_000, aliquota: 19.0, deduzir: 378_000 },
  ],
  // ANEXO II — Indústria
  II: [
    { faixa: 1, ate: 180_000, aliquota: 4.5, deduzir: 0 },
    { faixa: 2, ate: 360_000, aliquota: 7.8, deduzir: 5_940 },
    { faixa: 3, ate: 720_000, aliquota: 10.0, deduzir: 13_860 },
    { faixa: 4, ate: 1_800_000, aliquota: 11.2, deduzir: 22_500 },
    { faixa: 5, ate: 3_600_000, aliquota: 14.7, deduzir: 85_500 },
    { faixa: 6, ate: 4_800_000, aliquota: 30.0, deduzir: 720_000 },
  ],
  // ANEXO III — Serviços (instalação, reparo, agências, academias etc.)
  III: [
    { faixa: 1, ate: 180_000, aliquota: 6.0, deduzir: 0 },
    { faixa: 2, ate: 360_000, aliquota: 11.2, deduzir: 9_360 },
    { faixa: 3, ate: 720_000, aliquota: 13.5, deduzir: 17_640 },
    { faixa: 4, ate: 1_800_000, aliquota: 16.0, deduzir: 35_640 },
    { faixa: 5, ate: 3_600_000, aliquota: 21.0, deduzir: 125_640 },
    { faixa: 6, ate: 4_800_000, aliquota: 33.0, deduzir: 648_000 },
  ],
  // ANEXO IV — Serviços (construção civil, limpeza, vigilância). CPP fora do DAS.
  IV: [
    { faixa: 1, ate: 180_000, aliquota: 4.5, deduzir: 0 },
    { faixa: 2, ate: 360_000, aliquota: 9.0, deduzir: 8_100 },
    { faixa: 3, ate: 720_000, aliquota: 10.2, deduzir: 12_420 },
    { faixa: 4, ate: 1_800_000, aliquota: 14.0, deduzir: 39_780 },
    { faixa: 5, ate: 3_600_000, aliquota: 22.0, deduzir: 183_780 },
    { faixa: 6, ate: 4_800_000, aliquota: 33.0, deduzir: 828_000 },
  ],
  // ANEXO V — Serviços sujeitos ao Fator R (quando < 28%).
  V: [
    { faixa: 1, ate: 180_000, aliquota: 15.5, deduzir: 0 },
    { faixa: 2, ate: 360_000, aliquota: 18.0, deduzir: 4_500 },
    { faixa: 3, ate: 720_000, aliquota: 19.5, deduzir: 9_900 },
    { faixa: 4, ate: 1_800_000, aliquota: 20.5, deduzir: 17_100 },
    { faixa: 5, ate: 3_600_000, aliquota: 23.0, deduzir: 62_100 },
    { faixa: 6, ate: 4_800_000, aliquota: 30.5, deduzir: 540_000 },
  ],
};

// ----------------------------------------------------------------------------
// MEI — Microempreendedor Individual. DAS-SIMEI é valor FIXO mensal:
//   INSS (CPP do contribuinte): 5% do salário mínimo
//   + ICMS R$ 1,00 (comércio/indústria)  ou  ISS R$ 5,00 (serviços)
// LC 123/2006, art. 18-A. O salário mínimo é parâmetro anual.
// ----------------------------------------------------------------------------
export const SALARIO_MINIMO_2026 = 1_621.0; // referência 2026
export const MEI_INSS_PERCENTUAL = 0.05; // 5% do salário mínimo
export const MEI_ICMS = 1.0;
export const MEI_ISS = 5.0;

// ----------------------------------------------------------------------------
// LUCRO PRESUMIDO — percentuais de presunção sobre a receita bruta.
// IRPJ: RIR/2018 (Decreto 9.580/2018) art. 591/592; CSLL: art. 20 da Lei 9.249/95.
// ----------------------------------------------------------------------------
export interface PresuncaoAtividade {
  chave: string;
  rotulo: string;
  presuncaoIRPJ: number; // % sobre a receita para base do IRPJ
  presuncaoCSLL: number; // % sobre a receita para base da CSLL
}

export const presuncoesPresumido: PresuncaoAtividade[] = [
  {
    chave: 'comercio_industria',
    rotulo: 'Comércio / Indústria (venda de mercadorias)',
    presuncaoIRPJ: 8,
    presuncaoCSLL: 12,
  },
  {
    chave: 'servicos_gerais',
    rotulo: 'Serviços em geral',
    presuncaoIRPJ: 32,
    presuncaoCSLL: 32,
  },
  {
    chave: 'transporte_cargas',
    rotulo: 'Transporte de cargas',
    presuncaoIRPJ: 8,
    presuncaoCSLL: 12,
  },
  {
    chave: 'transporte_passageiros',
    rotulo: 'Transporte de passageiros',
    presuncaoIRPJ: 16,
    presuncaoCSLL: 12,
  },
  {
    chave: 'servicos_hospitalares',
    rotulo: 'Serviços hospitalares / diagnósticos',
    presuncaoIRPJ: 8,
    presuncaoCSLL: 12,
  },
  {
    chave: 'revenda_combustiveis',
    rotulo: 'Revenda de combustíveis',
    presuncaoIRPJ: 1.6,
    presuncaoCSLL: 12,
  },
];

// ----------------------------------------------------------------------------
// Alíquotas federais comuns a Presumido e Real.
// ----------------------------------------------------------------------------
export const IRPJ_ALIQUOTA = 15; // % — Lei 9.249/95, art. 3º
export const IRPJ_ADICIONAL_ALIQUOTA = 10; // % sobre o excedente
export const IRPJ_ADICIONAL_LIMITE_MENSAL = 20_000; // R$ por mês de apuração
export const CSLL_ALIQUOTA = 9; // % — Lei 7.689/88 c/ alterações

// PIS/COFINS cumulativo (Lucro Presumido) — Lei 9.715/98 e Lei 9.718/98.
export const PIS_CUMULATIVO = 0.65; // %
export const COFINS_CUMULATIVO = 3.0; // %

// PIS/COFINS não-cumulativo (Lucro Real) — Lei 10.637/02 e Lei 10.833/03.
export const PIS_NAO_CUMULATIVO = 1.65; // %
export const COFINS_NAO_CUMULATIVO = 7.6; // %
