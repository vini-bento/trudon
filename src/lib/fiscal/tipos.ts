// Tipos compartilhados do motor fiscal e helper de arredondamento.
import type { RegimeTributario } from '@/data/types';

export type { RegimeTributario };

/** Arredonda para centavos (2 casas), padrão de recolhimento de tributos. */
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Um passo da memória de cálculo, exibido na tela para conferência humana. */
export interface PassoCalculo {
  rotulo: string;
  texto?: string; // quando o passo é textual (ex.: "Anexo III")
  valor?: number; // quando é numérico
  tipo?: 'moeda' | 'percentual' | 'numero';
  destaque?: boolean; // resultado final do tributo
}

/** Tipo de guia de recolhimento. */
export type Guia = 'DAS' | 'DARF' | 'GPS' | 'GNRE' | 'Guia Municipal (ISS)';

/** Um tributo apurado, com base, alíquota, valor e memória de cálculo. */
export interface Tributo {
  sigla: string; // DAS, IRPJ, CSLL, PIS, COFINS, ISS, ICMS, CPP...
  nome: string;
  periodicidade: 'Mensal' | 'Trimestral' | 'Anual';
  guia: Guia;
  base: number;
  aliquota: number; // alíquota efetiva aplicada, em %
  valor: number;
  memoria: PassoCalculo[];
  observacao?: string;
}

/** Resultado completo de uma apuração. */
export interface ResultadoApuracao {
  regime: RegimeTributario;
  competencia: string; // "YYYY-MM" (mês) ou "YYYY-Tn" (trimestre)
  tributos: Tributo[];
  total: number;
  avisos: string[];
}
