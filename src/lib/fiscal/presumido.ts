// ============================================================================
// Apuração do Lucro Presumido.
//   IRPJ e CSLL: trimestrais, sobre base presumida (% sobre a receita bruta).
//   PIS e COFINS: mensais, cumulativos, sobre o faturamento.
//   ISS: municipal — alíquota varia por município, então é INFORMADA, nunca
//        chutada (entre 2% e 5% conforme a Lei do município).
// ============================================================================
import {
  presuncoesPresumido,
  IRPJ_ALIQUOTA,
  IRPJ_ADICIONAL_ALIQUOTA,
  IRPJ_ADICIONAL_LIMITE_MENSAL,
  CSLL_ALIQUOTA,
  PIS_CUMULATIVO,
  COFINS_CUMULATIVO,
} from './tabelas';
import { round2, type Tributo, type ResultadoApuracao } from './tipos';

export interface EntradaPresumido {
  competencia: string; // "YYYY-MM"
  atividade: string; // chave de presuncoesPresumido
  receitaTrimestre: number; // base do IRPJ/CSLL (acumulado do trimestre)
  mesesPeriodo?: number; // meses do período de apuração (padrão 3)
  receitaMes: number; // base do PIS/COFINS (faturamento do mês)
  issAliquota?: number; // % do ISS (informado pelo contador; varia por município)
  issBase?: number; // base de serviços para o ISS no mês
}

/** Adicional de IRPJ: 10% sobre o que exceder R$ 20.000 × meses do período. */
export function adicionalIRPJ(base: number, meses: number): number {
  const limite = IRPJ_ADICIONAL_LIMITE_MENSAL * meses;
  const excedente = Math.max(0, base - limite);
  return excedente * (IRPJ_ADICIONAL_ALIQUOTA / 100);
}

export function apurarPresumido(e: EntradaPresumido): ResultadoApuracao {
  const avisos: string[] = [];
  const meses = e.mesesPeriodo ?? 3;
  const presuncao = presuncoesPresumido.find((p) => p.chave === e.atividade);
  if (!presuncao) {
    avisos.push(`Atividade "${e.atividade}" não encontrada. Cálculo IRPJ/CSLL não realizado.`);
  }

  const tributos: Tributo[] = [];

  if (presuncao) {
    // IRPJ trimestral
    const baseIRPJ = round2(e.receitaTrimestre * (presuncao.presuncaoIRPJ / 100));
    const irpjNormal = round2(baseIRPJ * (IRPJ_ALIQUOTA / 100));
    const adicional = round2(adicionalIRPJ(baseIRPJ, meses));
    const irpj = round2(irpjNormal + adicional);
    tributos.push({
      sigla: 'IRPJ',
      nome: 'Imposto de Renda Pessoa Jurídica',
      periodicidade: 'Trimestral',
      guia: 'DARF',
      base: baseIRPJ,
      aliquota: IRPJ_ALIQUOTA,
      valor: irpj,
      memoria: [
        { rotulo: 'Receita do trimestre', valor: e.receitaTrimestre, tipo: 'moeda' },
        { rotulo: `Presunção (${presuncao.rotulo})`, valor: presuncao.presuncaoIRPJ, tipo: 'percentual' },
        { rotulo: 'Base de cálculo', valor: baseIRPJ, tipo: 'moeda' },
        { rotulo: 'IRPJ (15%)', valor: irpjNormal, tipo: 'moeda' },
        {
          rotulo: `Adicional 10% sobre o que excede R$ ${(IRPJ_ADICIONAL_LIMITE_MENSAL * meses).toLocaleString('pt-BR')}`,
          valor: adicional,
          tipo: 'moeda',
        },
        { rotulo: 'IRPJ total', valor: irpj, tipo: 'moeda', destaque: true },
      ],
    });

    // CSLL trimestral
    const baseCSLL = round2(e.receitaTrimestre * (presuncao.presuncaoCSLL / 100));
    const csll = round2(baseCSLL * (CSLL_ALIQUOTA / 100));
    tributos.push({
      sigla: 'CSLL',
      nome: 'Contribuição Social sobre o Lucro Líquido',
      periodicidade: 'Trimestral',
      guia: 'DARF',
      base: baseCSLL,
      aliquota: CSLL_ALIQUOTA,
      valor: csll,
      memoria: [
        { rotulo: 'Receita do trimestre', valor: e.receitaTrimestre, tipo: 'moeda' },
        { rotulo: `Presunção (${presuncao.rotulo})`, valor: presuncao.presuncaoCSLL, tipo: 'percentual' },
        { rotulo: 'Base de cálculo', valor: baseCSLL, tipo: 'moeda' },
        { rotulo: 'CSLL (9%)', valor: csll, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // PIS mensal cumulativo
  const pis = round2(e.receitaMes * (PIS_CUMULATIVO / 100));
  tributos.push({
    sigla: 'PIS',
    nome: 'PIS (cumulativo)',
    periodicidade: 'Mensal',
    guia: 'DARF',
    base: e.receitaMes,
    aliquota: PIS_CUMULATIVO,
    valor: pis,
    memoria: [
      { rotulo: 'Faturamento do mês', valor: e.receitaMes, tipo: 'moeda' },
      { rotulo: 'PIS (0,65%)', valor: pis, tipo: 'moeda', destaque: true },
    ],
  });

  // COFINS mensal cumulativo
  const cofins = round2(e.receitaMes * (COFINS_CUMULATIVO / 100));
  tributos.push({
    sigla: 'COFINS',
    nome: 'COFINS (cumulativo)',
    periodicidade: 'Mensal',
    guia: 'DARF',
    base: e.receitaMes,
    aliquota: COFINS_CUMULATIVO,
    valor: cofins,
    memoria: [
      { rotulo: 'Faturamento do mês', valor: e.receitaMes, tipo: 'moeda' },
      { rotulo: 'COFINS (3%)', valor: cofins, tipo: 'moeda', destaque: true },
    ],
  });

  // ISS mensal (somente quando a alíquota é informada — varia por município)
  if (e.issAliquota != null && e.issBase != null) {
    const iss = round2(e.issBase * (e.issAliquota / 100));
    tributos.push({
      sigla: 'ISS',
      nome: 'Imposto Sobre Serviços (municipal)',
      periodicidade: 'Mensal',
      guia: 'Guia Municipal (ISS)',
      base: e.issBase,
      aliquota: e.issAliquota,
      valor: iss,
      observacao: 'Alíquota definida pela legislação do município (2% a 5%).',
      memoria: [
        { rotulo: 'Base de serviços', valor: e.issBase, tipo: 'moeda' },
        { rotulo: 'Alíquota do município', valor: e.issAliquota, tipo: 'percentual' },
        { rotulo: 'ISS', valor: iss, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // O total mensal a recolher considera PIS+COFINS(+ISS); IRPJ/CSLL são
  // trimestrais e exibidos à parte. Somamos tudo para visão geral, mas a UI
  // separa por periodicidade.
  const total = round2(tributos.reduce((s, t) => s + t.valor, 0));

  return {
    regime: 'Lucro Presumido',
    competencia: e.competencia,
    tributos,
    total,
    avisos,
  };
}
