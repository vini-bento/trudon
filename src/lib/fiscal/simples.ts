// ============================================================================
// Apuração do Simples Nacional (DAS) e do MEI (DAS-SIMEI).
// Fórmula da alíquota efetiva — LC 123/2006, art. 18:
//   alíquota efetiva = [(RBT12 × alíquota nominal) − parcela a deduzir] / RBT12
//   DAS do mês = receita do mês × alíquota efetiva
// ============================================================================
import {
  tabelasSimples,
  LIMITE_SIMPLES,
  FATOR_R_LIMITE,
  SALARIO_MINIMO_2026,
  MEI_INSS_PERCENTUAL,
  MEI_ICMS,
  MEI_ISS,
  type AnexoSimples,
  type FaixaSimples,
} from './tabelas';
import { round2, type Tributo, type ResultadoApuracao } from './tipos';

export interface EntradaSimples {
  competencia: string; // "YYYY-MM"
  anexo: AnexoSimples; // anexo natural da atividade
  rbt12: number; // receita bruta acumulada nos 12 meses anteriores
  receitaMes: number; // receita do mês de apuração
  sujeitoFatorR?: boolean; // atividade que migra entre Anexo III e V pelo Fator R
  folha12?: number; // folha dos 12 meses anteriores (necessária se sujeitoFatorR)
}

/** Localiza a faixa do RBT12 dentro de um anexo. */
export function faixaPorRBT12(anexo: AnexoSimples, rbt12: number): FaixaSimples {
  const faixas = tabelasSimples[anexo];
  // RBT12 = 0 (início de atividade sem histórico) cai na 1ª faixa.
  if (rbt12 <= 0) return faixas[0];
  return faixas.find((f) => rbt12 <= f.ate) ?? faixas[faixas.length - 1];
}

/** Alíquota efetiva (em %) do Simples para um RBT12 e anexo. */
export function aliquotaEfetivaSimples(
  anexo: AnexoSimples,
  rbt12: number,
): { faixa: FaixaSimples; efetiva: number } {
  const faixa = faixaPorRBT12(anexo, rbt12);
  // Para RBT12 = 0 usa-se a alíquota nominal da 1ª faixa (deduzir = 0).
  if (rbt12 <= 0) return { faixa, efetiva: faixa.aliquota };
  const efetivaFracao =
    (rbt12 * (faixa.aliquota / 100) - faixa.deduzir) / rbt12;
  return { faixa, efetiva: efetivaFracao * 100 };
}

/** Fator R = folha 12 meses / receita 12 meses (fração, ex.: 0,30 = 30%). */
export function fatorR(folha12: number, rbt12: number): number {
  if (rbt12 <= 0) return 0;
  return folha12 / rbt12;
}

export function apurarSimples(e: EntradaSimples): ResultadoApuracao {
  const avisos: string[] = [];

  if (e.rbt12 > LIMITE_SIMPLES) {
    avisos.push(
      `RBT12 de ${e.rbt12.toLocaleString('pt-BR')} excede o limite do Simples (R$ 4.800.000). Verifique o desenquadramento.`,
    );
  }
  if (e.rbt12 <= 0) {
    avisos.push(
      'RBT12 igual a zero: para empresas em início de atividade, a receita dos 12 meses deve ser estimada (média mensal × 12). Cálculo feito na 1ª faixa.',
    );
  }

  // Define o anexo efetivo aplicando o Fator R, quando a atividade está sujeita.
  let anexo = e.anexo;
  const memoriaFatorR = [];
  if (e.sujeitoFatorR) {
    const folha12 = e.folha12 ?? 0;
    if (e.folha12 == null) {
      avisos.push(
        'Atividade sujeita ao Fator R sem folha de 12 meses informada: assumida folha = 0 (Anexo V).',
      );
    }
    const fr = fatorR(folha12, e.rbt12);
    anexo = fr >= FATOR_R_LIMITE ? 'III' : 'V';
    memoriaFatorR.push(
      { rotulo: 'Folha 12 meses', valor: folha12, tipo: 'moeda' as const },
      {
        rotulo: 'Fator R (folha ÷ RBT12)',
        valor: fr * 100,
        tipo: 'percentual' as const,
      },
      {
        rotulo: `Fator R ${fr >= FATOR_R_LIMITE ? '≥' : '<'} 28% → Anexo ${anexo}`,
        texto: `Anexo ${anexo}`,
      },
    );
  }

  const { faixa, efetiva } = aliquotaEfetivaSimples(anexo, e.rbt12);
  const valor = round2(e.receitaMes * (efetiva / 100));

  const tributo: Tributo = {
    sigla: 'DAS',
    nome: `Simples Nacional — Anexo ${anexo} (faixa ${faixa.faixa})`,
    periodicidade: 'Mensal',
    guia: 'DAS',
    base: e.receitaMes,
    aliquota: efetiva,
    valor,
    memoria: [
      { rotulo: 'RBT12 (receita 12 meses)', valor: e.rbt12, tipo: 'moeda' },
      ...memoriaFatorR,
      { rotulo: `Anexo ${anexo} · faixa ${faixa.faixa}`, texto: `até ${faixa.ate.toLocaleString('pt-BR')}` },
      { rotulo: 'Alíquota nominal', valor: faixa.aliquota, tipo: 'percentual' },
      { rotulo: 'Parcela a deduzir', valor: faixa.deduzir, tipo: 'moeda' },
      {
        rotulo: 'Alíquota efetiva = [(RBT12 × alíq) − deduzir] ÷ RBT12',
        valor: efetiva,
        tipo: 'percentual',
      },
      { rotulo: 'Receita do mês', valor: e.receitaMes, tipo: 'moeda' },
      { rotulo: 'DAS = receita × alíquota efetiva', valor, tipo: 'moeda', destaque: true },
    ],
  };

  return {
    regime: 'Simples Nacional',
    competencia: e.competencia,
    tributos: [tributo],
    total: valor,
    avisos,
  };
}

export interface EntradaMEI {
  competencia: string;
  atividade: 'comercio_industria' | 'servicos' | 'comercio_servicos';
}

/** DAS-SIMEI: valor fixo mensal (INSS 5% do salário mínimo + ICMS e/ou ISS). */
export function apurarMEI(e: EntradaMEI): ResultadoApuracao {
  const inss = round2(SALARIO_MINIMO_2026 * MEI_INSS_PERCENTUAL);
  const icms = e.atividade !== 'servicos' ? MEI_ICMS : 0;
  const iss = e.atividade !== 'comercio_industria' ? MEI_ISS : 0;
  const valor = round2(inss + icms + iss);

  return {
    regime: 'MEI',
    competencia: e.competencia,
    total: valor,
    avisos: [],
    tributos: [
      {
        sigla: 'DAS-SIMEI',
        nome: 'MEI — DAS fixo mensal',
        periodicidade: 'Mensal',
        guia: 'DAS',
        base: SALARIO_MINIMO_2026,
        aliquota: MEI_INSS_PERCENTUAL * 100,
        valor,
        memoria: [
          { rotulo: 'Salário mínimo (base do INSS)', valor: SALARIO_MINIMO_2026, tipo: 'moeda' },
          { rotulo: 'INSS (5% do salário mínimo)', valor: inss, tipo: 'moeda' },
          ...(icms ? [{ rotulo: 'ICMS (comércio/indústria)', valor: icms, tipo: 'moeda' as const }] : []),
          ...(iss ? [{ rotulo: 'ISS (serviços)', valor: iss, tipo: 'moeda' as const }] : []),
          { rotulo: 'DAS-SIMEI total', valor, tipo: 'moeda', destaque: true },
        ],
      },
    ],
  };
}
