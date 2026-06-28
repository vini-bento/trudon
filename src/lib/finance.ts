// Cálculos do módulo de Honorários (recebíveis, inadimplência, fluxo de caixa).
import type { Cobranca } from '@/data/types';
import { arredondar } from './accounting';

export interface ResumoHonorarios {
  totalMes: number;
  recebido: number;
  pendente: number;
  atrasado: number;
  taxaInadimplencia: number; // % do valor atrasado sobre o total
}

/** Resumo financeiro de um conjunto de cobranças (tipicamente um mês). */
export function resumoHonorarios(cobrancas: Cobranca[]): ResumoHonorarios {
  let recebido = 0;
  let pendente = 0;
  let atrasado = 0;
  for (const c of cobrancas) {
    if (c.status === 'Pago') recebido += c.valor;
    else if (c.status === 'Pendente') pendente += c.valor;
    else if (c.status === 'Atrasado') atrasado += c.valor;
  }
  const totalMes = recebido + pendente + atrasado;
  const taxaInadimplencia = totalMes > 0 ? (atrasado / totalMes) * 100 : 0;
  return {
    totalMes: arredondar(totalMes),
    recebido: arredondar(recebido),
    pendente: arredondar(pendente),
    atrasado: arredondar(atrasado),
    taxaInadimplencia: arredondar(taxaInadimplencia),
  };
}

export interface PontoFluxo {
  competencia: string;
  orcado: number;
  realizado: number;
}

/**
 * Fluxo de caixa orçado × realizado por competência.
 * "Orçado" = tudo que foi faturado; "Realizado" = o que foi efetivamente pago.
 */
export function fluxoCaixa(cobrancas: Cobranca[]): PontoFluxo[] {
  const mapa = new Map<string, { orcado: number; realizado: number }>();
  for (const c of cobrancas) {
    const p = mapa.get(c.competencia) ?? { orcado: 0, realizado: 0 };
    p.orcado += c.valor;
    if (c.status === 'Pago') p.realizado += c.valor;
    mapa.set(c.competencia, p);
  }
  return [...mapa.entries()]
    .map(([competencia, v]) => ({
      competencia,
      orcado: arredondar(v.orcado),
      realizado: arredondar(v.realizado),
    }))
    .sort((a, b) => a.competencia.localeCompare(b.competencia));
}
