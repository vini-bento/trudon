// ============================================================================
// Apuração do Lucro Real.
//   IRPJ/CSLL: sobre o lucro real (lucro contábil ajustado por adições e
//   exclusões — e-LALUR). A base é INFORMADA pelo contador, pois depende da
//   escrituração; o motor aplica as alíquotas e o adicional.
//   PIS/COFINS: não-cumulativos — débito sobre a receita menos crédito sobre
//   as bases creditáveis (insumos, energia, etc.).
// ============================================================================
import {
  IRPJ_ALIQUOTA,
  CSLL_ALIQUOTA,
  PIS_NAO_CUMULATIVO,
  COFINS_NAO_CUMULATIVO,
} from './tabelas';
import { adicionalIRPJ } from './presumido';
import { round2, type Tributo, type ResultadoApuracao } from './tipos';

export interface EntradaReal {
  competencia: string; // "YYYY-MM"
  lucroReal: number; // base do IRPJ (lucro líquido ajustado pelo LALUR)
  baseCSLL?: number; // base da CSLL (padrão = lucroReal)
  mesesPeriodo?: number; // meses do período (padrão 3)
  receitaMes: number; // base de débito de PIS/COFINS
  baseCreditos?: number; // base creditável de PIS/COFINS (insumos etc.)
}

export function apurarReal(e: EntradaReal): ResultadoApuracao {
  const meses = e.mesesPeriodo ?? 3;
  const tributos: Tributo[] = [];

  // IRPJ
  const irpjNormal = round2(e.lucroReal * (IRPJ_ALIQUOTA / 100));
  const adicional = round2(adicionalIRPJ(e.lucroReal, meses));
  const irpj = round2(irpjNormal + adicional);
  tributos.push({
    sigla: 'IRPJ',
    nome: 'Imposto de Renda Pessoa Jurídica',
    periodicidade: 'Trimestral',
    guia: 'DARF',
    base: e.lucroReal,
    aliquota: IRPJ_ALIQUOTA,
    valor: irpj,
    memoria: [
      { rotulo: 'Lucro real (base ajustada)', valor: e.lucroReal, tipo: 'moeda' },
      { rotulo: 'IRPJ (15%)', valor: irpjNormal, tipo: 'moeda' },
      { rotulo: `Adicional 10% sobre o que excede R$ ${(20_000 * meses).toLocaleString('pt-BR')}`, valor: adicional, tipo: 'moeda' },
      { rotulo: 'IRPJ total', valor: irpj, tipo: 'moeda', destaque: true },
    ],
  });

  // CSLL
  const baseCSLL = e.baseCSLL ?? e.lucroReal;
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
      { rotulo: 'Base de cálculo', valor: baseCSLL, tipo: 'moeda' },
      { rotulo: 'CSLL (9%)', valor: csll, tipo: 'moeda', destaque: true },
    ],
  });

  // PIS não-cumulativo
  const pisDebito = round2(e.receitaMes * (PIS_NAO_CUMULATIVO / 100));
  const pisCredito = round2((e.baseCreditos ?? 0) * (PIS_NAO_CUMULATIVO / 100));
  const pis = round2(Math.max(0, pisDebito - pisCredito));
  tributos.push({
    sigla: 'PIS',
    nome: 'PIS (não-cumulativo)',
    periodicidade: 'Mensal',
    guia: 'DARF',
    base: e.receitaMes,
    aliquota: PIS_NAO_CUMULATIVO,
    valor: pis,
    memoria: [
      { rotulo: 'Débito — receita × 1,65%', valor: pisDebito, tipo: 'moeda' },
      { rotulo: 'Crédito — base creditável × 1,65%', valor: pisCredito, tipo: 'moeda' },
      { rotulo: 'PIS a recolher (débito − crédito)', valor: pis, tipo: 'moeda', destaque: true },
    ],
  });

  // COFINS não-cumulativo
  const cofinsDebito = round2(e.receitaMes * (COFINS_NAO_CUMULATIVO / 100));
  const cofinsCredito = round2((e.baseCreditos ?? 0) * (COFINS_NAO_CUMULATIVO / 100));
  const cofins = round2(Math.max(0, cofinsDebito - cofinsCredito));
  tributos.push({
    sigla: 'COFINS',
    nome: 'COFINS (não-cumulativo)',
    periodicidade: 'Mensal',
    guia: 'DARF',
    base: e.receitaMes,
    aliquota: COFINS_NAO_CUMULATIVO,
    valor: cofins,
    memoria: [
      { rotulo: 'Débito — receita × 7,6%', valor: cofinsDebito, tipo: 'moeda' },
      { rotulo: 'Crédito — base creditável × 7,6%', valor: cofinsCredito, tipo: 'moeda' },
      { rotulo: 'COFINS a recolher (débito − crédito)', valor: cofins, tipo: 'moeda', destaque: true },
    ],
  });

  const total = round2(tributos.reduce((s, t) => s + t.valor, 0));

  return {
    regime: 'Lucro Real',
    competencia: e.competencia,
    tributos,
    total,
    avisos: [
      'Lucro Real: a base do IRPJ/CSLL depende da escrituração contábil (adições e exclusões do e-LALUR). Confira a base informada.',
    ],
  };
}
