// ============================================================================
// Motor de cálculo da folha. Funções puras, testáveis e com memória de cálculo.
// ============================================================================
import {
  faixasINSS,
  faixasIRRF,
  TETO_INSS,
  DEDUCAO_DEPENDENTE,
  IRRF_REDUTOR_MAX,
  IRRF_ISENCAO_TOTAL_ATE,
  IRRF_REDUCAO_PARCIAL_ATE,
  IRRF_REDUTOR_FORMULA_A,
  IRRF_REDUTOR_FORMULA_B,
  FGTS_PADRAO,
  FGTS_APRENDIZ,
  CPP_PATRONAL,
  TERCEIROS_PADRAO,
  RAT_PADRAO,
  ADICIONAL_NOTURNO,
  HORA_EXTRA_50,
  HORA_EXTRA_100,
  PERICULOSIDADE,
  INSALUBRIDADE_GRAUS,
  VALE_TRANSPORTE_DESCONTO_MAX,
  SALARIO_MINIMO,
  HORAS_MES_PADRAO,
} from './tabelas';
import {
  round2,
  type PassoCalculo,
  type Funcionario,
  type VariaveisMes,
  type ResultadoFolha,
  type ItemFolha,
} from './tipos';

// ---------------------------------------------------------------- INSS
export interface ResultadoTributo {
  valor: number;
  aliquota: number;
  memoria: PassoCalculo[];
}

/** INSS do empregado (tabela progressiva com parcela a deduzir, respeita o teto). */
export function calcularINSS(base: number): ResultadoTributo {
  const baseLimitada = Math.min(base, TETO_INSS);
  const faixa =
    faixasINSS.find((f) => baseLimitada <= f.ate) ??
    faixasINSS[faixasINSS.length - 1];
  const valor = round2(baseLimitada * (faixa.aliquota / 100) - faixa.deduzir);
  return {
    valor: Math.max(0, valor),
    aliquota: faixa.aliquota,
    memoria: [
      { rotulo: 'Base de cálculo (salário de contribuição)', valor: baseLimitada, tipo: 'moeda' },
      ...(base > TETO_INSS
        ? [{ rotulo: 'Base limitada ao teto', valor: TETO_INSS, tipo: 'moeda' as const }]
        : []),
      { rotulo: 'Alíquota da faixa', valor: faixa.aliquota, tipo: 'percentual' },
      { rotulo: 'Parcela a deduzir', valor: faixa.deduzir, tipo: 'moeda' },
      { rotulo: 'INSS = base × alíquota − dedução', valor: Math.max(0, valor), tipo: 'moeda', destaque: true },
    ],
  };
}

// ---------------------------------------------------------------- IRRF
export interface ResultadoIRRF extends ResultadoTributo {
  redutorAplicado: number;
}

/**
 * IRRF mensal (Lei 9.250/95 com a redução do Art. 3º-A, Lei 15.270/2025).
 *   1) base de cálculo = rendimento bruto − INSS − (dependentes × dedução)
 *   2) imposto pela tabela progressiva sobre a base
 *   3) redução da Lei 15.270/2025, indexada pela BASE DE CÁLCULO
 *      ("rendimentos tributáveis sujeitos à incidência mensal"), limitada ao
 *      imposto apurado (§1):
 *        • base até R$ 5.000        → redução de até R$ 312,89 (zera o imposto)
 *        • base R$ 5.000,01–7.350   → R$ 978,62 − (0,133145 × base)
 *        • base acima de R$ 7.350   → sem redução (§2)
 *   IRRF = imposto − redução.
 */
export function calcularIRRF(
  rendimentoBruto: number,
  inss: number,
  dependentes: number,
): ResultadoIRRF {
  const deducaoDependentes = round2(dependentes * DEDUCAO_DEPENDENTE);
  const base = round2(rendimentoBruto - inss - deducaoDependentes);
  const faixa =
    faixasIRRF.find((f) => base <= f.ate) ?? faixasIRRF[faixasIRRF.length - 1];
  const impostoTabela = Math.max(0, round2(base * (faixa.aliquota / 100) - faixa.deduzir));

  // Redução da Lei 15.270/2025 — indexada pela BASE DE CÁLCULO e limitada ao
  // imposto apurado (§1).
  let redutor = 0;
  if (base <= IRRF_ISENCAO_TOTAL_ATE) {
    redutor = Math.min(impostoTabela, IRRF_REDUTOR_MAX);
  } else if (base <= IRRF_REDUCAO_PARCIAL_ATE) {
    const formula = Math.max(
      0,
      round2(IRRF_REDUTOR_FORMULA_A - IRRF_REDUTOR_FORMULA_B * base),
    );
    redutor = Math.min(impostoTabela, formula);
  }
  const valor = Math.max(0, round2(impostoTabela - redutor));

  return {
    valor,
    aliquota: faixa.aliquota,
    redutorAplicado: round2(redutor),
    memoria: [
      { rotulo: 'Rendimento bruto tributável', valor: rendimentoBruto, tipo: 'moeda' },
      { rotulo: '(−) INSS', valor: inss, tipo: 'moeda' },
      ...(dependentes > 0
        ? [{ rotulo: `(−) Dependentes (${dependentes} × R$ ${DEDUCAO_DEPENDENTE.toLocaleString('pt-BR')})`, valor: deducaoDependentes, tipo: 'moeda' as const }]
        : []),
      { rotulo: 'Base de cálculo do IRRF', valor: base, tipo: 'moeda' },
      { rotulo: 'Alíquota da faixa', valor: faixa.aliquota, tipo: 'percentual' },
      { rotulo: 'Imposto pela tabela', valor: impostoTabela, tipo: 'moeda' },
      { rotulo: 'Redução Lei 15.270/2025 (Art. 3º-A)', valor: round2(redutor), tipo: 'moeda' },
      { rotulo: 'IRRF = imposto − redutor', valor, tipo: 'moeda', destaque: true },
    ],
  };
}

// ---------------------------------------------------------------- Adicionais
/** Valor da hora normal a partir do salário base e da jornada mensal. */
export function valorHora(salario: number, horasMes = HORAS_MES_PADRAO): number {
  return salario / horasMes;
}

// ---------------------------------------------------------------- Folha CLT
export interface OpcoesFolha {
  // Encargo patronal: no Simples Anexos I–III/V a CPP já está no DAS.
  cppForaDoDAS?: boolean; // true para Lucro Presumido/Real e Simples Anexo IV
  ratFap?: number; // alíquota RAT × FAP (padrão 2%)
  fgtsAprendiz?: boolean; // usa 2% em vez de 8%
  horasMes?: number;
}

/** Apura a folha mensal de um empregado CLT (e afins). */
export function calcularFolhaCLT(
  func: Funcionario,
  v: VariaveisMes,
  competencia: string,
  opcoes: OpcoesFolha = {},
): ResultadoFolha {
  const horasMes = opcoes.horasMes ?? HORAS_MES_PADRAO;
  const avisos: string[] = [];
  const proventos: ItemFolha[] = [];
  const descontos: ItemFolha[] = [];
  const encargosEmpregador: ItemFolha[] = [];

  const hora = valorHora(func.salario, horasMes);

  // 1) Salário base (líquido de faltas em dias)
  const valorFaltas = round2((func.salario / 30) * (v.faltasEmDias || 0));
  const salarioBase = round2(func.salario - valorFaltas);
  proventos.push({
    rotulo: 'Salário base',
    valor: salarioBase,
    memoria: [
      { rotulo: 'Salário mensal', valor: func.salario, tipo: 'moeda' },
      ...(v.faltasEmDias
        ? [{ rotulo: `(−) Faltas (${v.faltasEmDias} dia(s))`, valor: valorFaltas, tipo: 'moeda' as const }]
        : []),
    ],
  });

  // 2) Periculosidade (30% do salário base) OU insalubridade (sobre o mínimo)
  if (func.periculosidade) {
    const valor = round2(func.salario * PERICULOSIDADE);
    proventos.push({
      rotulo: 'Adicional de periculosidade (30%)',
      valor,
      memoria: [
        { rotulo: 'Salário base', valor: func.salario, tipo: 'moeda' },
        { rotulo: 'Periculosidade (30%)', valor, tipo: 'moeda', destaque: true },
      ],
    });
  } else if (func.insalubridadeGrau) {
    const perc = INSALUBRIDADE_GRAUS[func.insalubridadeGrau];
    const valor = round2(SALARIO_MINIMO * perc);
    proventos.push({
      rotulo: `Adicional de insalubridade (${perc * 100}%)`,
      valor,
      memoria: [
        { rotulo: 'Base (salário mínimo)', valor: SALARIO_MINIMO, tipo: 'moeda' },
        { rotulo: `Insalubridade (${perc * 100}%)`, valor, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // 3) Horas extras
  if (v.horasExtras50 > 0) {
    const valor = round2(hora * (1 + HORA_EXTRA_50) * v.horasExtras50);
    proventos.push({
      rotulo: `Horas extras 50% (${v.horasExtras50}h)`,
      valor,
      memoria: [
        { rotulo: 'Valor da hora', valor: round2(hora), tipo: 'moeda' },
        { rotulo: 'Hora + 50%', valor: round2(hora * 1.5), tipo: 'moeda' },
        { rotulo: `× ${v.horasExtras50} hora(s)`, valor, tipo: 'moeda', destaque: true },
      ],
    });
  }
  if (v.horasExtras100 > 0) {
    const valor = round2(hora * (1 + HORA_EXTRA_100) * v.horasExtras100);
    proventos.push({
      rotulo: `Horas extras 100% (${v.horasExtras100}h)`,
      valor,
      memoria: [
        { rotulo: 'Valor da hora', valor: round2(hora), tipo: 'moeda' },
        { rotulo: 'Hora + 100%', valor: round2(hora * 2), tipo: 'moeda' },
        { rotulo: `× ${v.horasExtras100} hora(s)`, valor, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // 4) Adicional noturno (20% sobre a hora)
  if (v.horasNoturnas > 0) {
    const valor = round2(hora * ADICIONAL_NOTURNO * v.horasNoturnas);
    proventos.push({
      rotulo: `Adicional noturno 20% (${v.horasNoturnas}h)`,
      valor,
      memoria: [
        { rotulo: 'Valor da hora', valor: round2(hora), tipo: 'moeda' },
        { rotulo: 'Adicional (20%)', valor: round2(hora * ADICIONAL_NOTURNO), tipo: 'moeda' },
        { rotulo: `× ${v.horasNoturnas} hora(s)`, valor, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // 5) Outros proventos
  if (v.outrosProventos > 0) {
    proventos.push({
      rotulo: 'Outros proventos (comissões, bônus)',
      valor: round2(v.outrosProventos),
      memoria: [{ rotulo: 'Informado', valor: round2(v.outrosProventos), tipo: 'moeda' }],
    });
  }

  const totalProventos = round2(proventos.reduce((s, p) => s + p.valor, 0));

  // ---- Descontos ----
  // INSS sobre o total de proventos
  const inss = calcularINSS(totalProventos);
  descontos.push({ rotulo: 'INSS', valor: inss.valor, memoria: inss.memoria });

  // IRRF
  const irrf = calcularIRRF(totalProventos, inss.valor, func.dependentes);
  descontos.push({ rotulo: 'IRRF', valor: irrf.valor, memoria: irrf.memoria });

  // Vale-transporte (até 6% do salário base)
  if (func.valeTransporte) {
    const valor = round2(func.salario * VALE_TRANSPORTE_DESCONTO_MAX);
    descontos.push({
      rotulo: 'Vale-transporte (6% do salário base)',
      valor,
      memoria: [
        { rotulo: 'Salário base', valor: func.salario, tipo: 'moeda' },
        { rotulo: 'Desconto máximo (6%)', valor, tipo: 'moeda', destaque: true },
      ],
    });
  }

  // Faltas já abatidas do salário base; outros descontos:
  if (v.outrosDescontos > 0) {
    descontos.push({
      rotulo: 'Outros descontos',
      valor: round2(v.outrosDescontos),
      memoria: [{ rotulo: 'Informado', valor: round2(v.outrosDescontos), tipo: 'moeda' }],
    });
  }

  const totalDescontos = round2(descontos.reduce((s, d) => s + d.valor, 0));
  const liquido = round2(totalProventos - totalDescontos);

  // ---- Encargos do empregador (não saem do salário) ----
  // FGTS
  const aliqFgts = opcoes.fgtsAprendiz ? FGTS_APRENDIZ : FGTS_PADRAO;
  const fgts = round2(totalProventos * aliqFgts);
  encargosEmpregador.push({
    rotulo: `FGTS (${aliqFgts * 100}%)`,
    valor: fgts,
    memoria: [
      { rotulo: 'Base (proventos)', valor: totalProventos, tipo: 'moeda' },
      { rotulo: `FGTS (${aliqFgts * 100}%)`, valor: fgts, tipo: 'moeda', destaque: true },
    ],
  });

  // CPP patronal + RAT + Terceiros (apenas fora do Simples Anexos I–III/V)
  if (opcoes.cppForaDoDAS) {
    const rat = opcoes.ratFap ?? RAT_PADRAO;
    const cpp = round2(totalProventos * CPP_PATRONAL);
    const valorRat = round2(totalProventos * rat);
    const terceiros = round2(totalProventos * TERCEIROS_PADRAO);
    encargosEmpregador.push({
      rotulo: 'INSS patronal (20%)',
      valor: cpp,
      memoria: [
        { rotulo: 'Base (proventos)', valor: totalProventos, tipo: 'moeda' },
        { rotulo: 'CPP (20%)', valor: cpp, tipo: 'moeda', destaque: true },
      ],
    });
    encargosEmpregador.push({
      rotulo: `RAT × FAP (${round2(rat * 100)}%)`,
      valor: valorRat,
      memoria: [
        { rotulo: 'Base (proventos)', valor: totalProventos, tipo: 'moeda' },
        { rotulo: `RAT (${round2(rat * 100)}%)`, valor: valorRat, tipo: 'moeda', destaque: true },
      ],
    });
    encargosEmpregador.push({
      rotulo: 'Terceiros / Sistema S (5,8%)',
      valor: terceiros,
      memoria: [
        { rotulo: 'Base (proventos)', valor: totalProventos, tipo: 'moeda' },
        { rotulo: 'Terceiros (5,8%)', valor: terceiros, tipo: 'moeda', destaque: true },
      ],
    });
  } else {
    avisos.push(
      'Empresa no Simples Nacional (Anexos I–III/V): a contribuição patronal (CPP) já está incluída no DAS; aqui consta apenas o FGTS. (Anexo IV recolhe os 20% à parte.)',
    );
  }

  const totalEncargos = round2(
    encargosEmpregador.reduce((s, e) => s + e.valor, 0),
  );

  return {
    modalidade: func.modalidade,
    competencia,
    proventos,
    descontos,
    encargosEmpregador,
    totalProventos,
    totalDescontos,
    liquido,
    totalEncargos,
    avisos,
  };
}
