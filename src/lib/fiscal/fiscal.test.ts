// Testes do motor fiscal — cada valor esperado vem de um cálculo conferível
// à mão a partir das regras citadas em tabelas.ts. Estes testes são a garantia
// de que nenhuma alteração futura quebre um cálculo silenciosamente.
import { describe, it, expect } from 'vitest';
import {
  aliquotaEfetivaSimples,
  apurarSimples,
  apurarMEI,
  fatorR,
} from './simples';
import { apurarPresumido, adicionalIRPJ } from './presumido';
import { apurarReal } from './real';
import { tabelasSimples } from './tabelas';

describe('Tabelas do Simples', () => {
  it('cada anexo tem 6 faixas e a 1ª não tem parcela a deduzir', () => {
    for (const anexo of ['I', 'II', 'III', 'IV', 'V'] as const) {
      const faixas = tabelasSimples[anexo];
      expect(faixas).toHaveLength(6);
      expect(faixas[0].deduzir).toBe(0);
      expect(faixas[faixas.length - 1].ate).toBe(4_800_000);
    }
  });
});

describe('Alíquota efetiva do Simples (LC 123/2006, art. 18)', () => {
  it('Anexo I, RBT12 500.000 → faixa 3, efetiva 6,728%', () => {
    const { faixa, efetiva } = aliquotaEfetivaSimples('I', 500_000);
    expect(faixa.faixa).toBe(3);
    // (500000*0,095 - 13860)/500000 = 6,728%
    expect(efetiva).toBeCloseTo(6.728, 3);
  });

  it('Anexo III, RBT12 100.000 → faixa 1, efetiva 6% (sem dedução)', () => {
    const { efetiva } = aliquotaEfetivaSimples('III', 100_000);
    expect(efetiva).toBeCloseTo(6, 5);
  });
});

describe('DAS do Simples Nacional', () => {
  it('Anexo I, RBT12 500.000, receita mês 40.000 → DAS 2.691,20', () => {
    const r = apurarSimples({
      competencia: '2026-06',
      anexo: 'I',
      rbt12: 500_000,
      receitaMes: 40_000,
    });
    expect(r.total).toBeCloseTo(2691.2, 2);
    expect(r.tributos[0].sigla).toBe('DAS');
  });

  it('avisa quando RBT12 excede o limite de 4,8 milhões', () => {
    const r = apurarSimples({
      competencia: '2026-06',
      anexo: 'I',
      rbt12: 5_000_000,
      receitaMes: 100_000,
    });
    expect(r.avisos.some((a) => a.includes('limite'))).toBe(true);
  });
});

describe('Fator R (migração Anexo III ↔ V)', () => {
  it('folha 40.000 / RBT12 100.000 = 40% → Anexo III (6%)', () => {
    expect(fatorR(40_000, 100_000)).toBeCloseTo(0.4, 5);
    const r = apurarSimples({
      competencia: '2026-06',
      anexo: 'V',
      sujeitoFatorR: true,
      folha12: 40_000,
      rbt12: 100_000,
      receitaMes: 10_000,
    });
    // Anexo III faixa 1 = 6% → 600
    expect(r.total).toBeCloseTo(600, 2);
    expect(r.tributos[0].nome).toContain('Anexo III');
  });

  it('folha 20.000 / RBT12 100.000 = 20% → Anexo V (15,5%)', () => {
    const r = apurarSimples({
      competencia: '2026-06',
      anexo: 'V',
      sujeitoFatorR: true,
      folha12: 20_000,
      rbt12: 100_000,
      receitaMes: 10_000,
    });
    // Anexo V faixa 1 = 15,5% → 1.550
    expect(r.total).toBeCloseTo(1550, 2);
    expect(r.tributos[0].nome).toContain('Anexo V');
  });
});

describe('MEI (DAS-SIMEI fixo)', () => {
  it('serviços: INSS (5% de 1.621) + ISS 5 = 86,05', () => {
    const r = apurarMEI({ competencia: '2026-06', atividade: 'servicos' });
    expect(r.total).toBeCloseTo(86.05, 2);
  });
  it('comércio: INSS + ICMS 1 = 82,05', () => {
    const r = apurarMEI({ competencia: '2026-06', atividade: 'comercio_industria' });
    expect(r.total).toBeCloseTo(82.05, 2);
  });
  it('comércio e serviços: INSS + ICMS 1 + ISS 5 = 87,05', () => {
    const r = apurarMEI({ competencia: '2026-06', atividade: 'comercio_servicos' });
    expect(r.total).toBeCloseTo(87.05, 2);
  });
});

describe('Adicional de IRPJ (10% sobre excedente)', () => {
  it('base 96.000 em trimestre (limite 60.000) → 3.600', () => {
    expect(adicionalIRPJ(96_000, 3)).toBeCloseTo(3600, 2);
  });
  it('base abaixo do limite → sem adicional', () => {
    expect(adicionalIRPJ(24_000, 3)).toBe(0);
  });
});

describe('Lucro Presumido', () => {
  it('serviços, trimestre 300.000, mês 100.000', () => {
    const r = apurarPresumido({
      competencia: '2026-06',
      atividade: 'servicos_gerais',
      receitaTrimestre: 300_000,
      receitaMes: 100_000,
    });
    const t = Object.fromEntries(r.tributos.map((x) => [x.sigla, x.valor]));
    // IRPJ: base 96.000 → 14.400 + 3.600 adicional = 18.000
    expect(t.IRPJ).toBeCloseTo(18_000, 2);
    // CSLL: base 96.000 × 9% = 8.640
    expect(t.CSLL).toBeCloseTo(8_640, 2);
    // PIS 0,65% de 100.000 = 650
    expect(t.PIS).toBeCloseTo(650, 2);
    // COFINS 3% de 100.000 = 3.000
    expect(t.COFINS).toBeCloseTo(3_000, 2);
  });

  it('comércio, trimestre 300.000: presunção 8%/12%, sem adicional', () => {
    const r = apurarPresumido({
      competencia: '2026-06',
      atividade: 'comercio_industria',
      receitaTrimestre: 300_000,
      receitaMes: 100_000,
    });
    const t = Object.fromEntries(r.tributos.map((x) => [x.sigla, x.valor]));
    // IRPJ base 24.000 × 15% = 3.600 (sem adicional)
    expect(t.IRPJ).toBeCloseTo(3_600, 2);
    // CSLL base 36.000 × 9% = 3.240
    expect(t.CSLL).toBeCloseTo(3_240, 2);
  });

  it('ISS só aparece quando a alíquota é informada', () => {
    const semISS = apurarPresumido({
      competencia: '2026-06',
      atividade: 'servicos_gerais',
      receitaTrimestre: 300_000,
      receitaMes: 100_000,
    });
    expect(semISS.tributos.some((x) => x.sigla === 'ISS')).toBe(false);

    const comISS = apurarPresumido({
      competencia: '2026-06',
      atividade: 'servicos_gerais',
      receitaTrimestre: 300_000,
      receitaMes: 100_000,
      issAliquota: 5,
      issBase: 100_000,
    });
    const iss = comISS.tributos.find((x) => x.sigla === 'ISS');
    expect(iss?.valor).toBeCloseTo(5_000, 2);
  });
});

describe('Lucro Real', () => {
  it('lucro 200.000, receita 100.000, créditos 40.000', () => {
    const r = apurarReal({
      competencia: '2026-06',
      lucroReal: 200_000,
      receitaMes: 100_000,
      baseCreditos: 40_000,
    });
    const t = Object.fromEntries(r.tributos.map((x) => [x.sigla, x.valor]));
    // IRPJ: 30.000 + adicional (200.000-60.000)*10% = 14.000 → 44.000
    expect(t.IRPJ).toBeCloseTo(44_000, 2);
    // CSLL 200.000 × 9% = 18.000
    expect(t.CSLL).toBeCloseTo(18_000, 2);
    // PIS: 1.650 - 660 = 990
    expect(t.PIS).toBeCloseTo(990, 2);
    // COFINS: 7.600 - 3.040 = 4.560
    expect(t.COFINS).toBeCloseTo(4_560, 2);
  });
});
