// Testes do motor de folha — cada valor esperado foi conferido à mão a partir
// das tabelas oficiais (INSS Portaria MPS/MF 13/2026; IRRF Lei 15.270/2025).
import { describe, it, expect } from 'vitest';
import { calcularINSS, calcularIRRF, valorHora, calcularFolhaCLT } from './calc';
import type { Funcionario, VariaveisMes } from './tipos';

const SEM_VARIAVEIS: VariaveisMes = {
  horasExtras50: 0,
  horasExtras100: 0,
  horasNoturnas: 0,
  faltasEmDias: 0,
  outrosProventos: 0,
  outrosDescontos: 0,
};

function func(over: Partial<Funcionario> = {}): Funcionario {
  return {
    id: 'f1',
    empresaId: 'e1',
    nome: 'Teste',
    cpf: '',
    modalidade: 'CLT',
    cargo: '',
    dataAdmissao: '2026-01-01',
    salario: 3000,
    dependentes: 0,
    insalubridadeGrau: '',
    periculosidade: false,
    valeTransporte: false,
    ativo: true,
    observacoes: '',
    ...over,
  };
}

describe('INSS (Portaria MPS/MF 13/2026)', () => {
  it('faixa 1 — R$ 1.500 × 7,5% = 112,50', () => {
    expect(calcularINSS(1500).valor).toBeCloseTo(112.5, 2);
  });
  it('faixa 2 — R$ 2.000 × 9% − 24,32 = 155,68', () => {
    expect(calcularINSS(2000).valor).toBeCloseTo(155.68, 2);
  });
  it('faixa 3 — R$ 3.000 × 12% − 111,40 = 248,60', () => {
    expect(calcularINSS(3000).valor).toBeCloseTo(248.6, 2);
  });
  it('acima do teto — limita a 8.475,55 → 988,08', () => {
    expect(calcularINSS(10000).valor).toBeCloseTo(988.08, 2);
  });
});

describe('IRRF (Lei 15.270/2025 — Art. 3º-A, redução indexada pela base)', () => {
  it('base ≤ R$ 5.000 é isento (redução limitada ao imposto zera o tributo)', () => {
    const inss = calcularINSS(3000).valor; // 248,60
    const r = calcularIRRF(3000, inss, 0);
    // base 2.751,40 → imposto 36,92 ; base ≤ 5.000 → redução min(36,92; 312,89) = 36,92
    expect(r.valor).toBeCloseTo(0, 2);
  });
  it('base na faixa parcial — R$ 6.000 bruto → IRRF 312,43', () => {
    const inss = calcularINSS(6000).valor; // 641,50
    expect(inss).toBeCloseTo(641.5, 2);
    const r = calcularIRRF(6000, inss, 0);
    // base 5.358,50 → imposto 577,59 ; redução 978,62 − 0,133145×5.358,50 = 265,16
    expect(r.valor).toBeCloseTo(312.43, 2);
  });
  it('base na faixa parcial — R$ 8.000 bruto, 2 dependentes → IRRF 859,67', () => {
    const inss = calcularINSS(8000).valor; // 921,50 (8.000 está abaixo do teto)
    expect(inss).toBeCloseTo(921.5, 2);
    const r = calcularIRRF(8000, inss, 2);
    // base 6.699,32 → imposto 946,31 ; redução 978,62 − 0,133145×6.699,32 = 86,64
    expect(r.valor).toBeCloseTo(859.67, 2);
  });
});

describe('Valor da hora', () => {
  it('R$ 2.200 / 220h = R$ 10,00', () => {
    expect(valorHora(2200)).toBeCloseTo(10, 2);
  });
});

describe('Folha CLT — cenário simples (Simples Nacional)', () => {
  const r = calcularFolhaCLT(func({ salario: 3000 }), SEM_VARIAVEIS, '2026-06', {
    cppForaDoDAS: false,
  });
  it('proventos = salário base 3.000', () => {
    expect(r.totalProventos).toBeCloseTo(3000, 2);
  });
  it('descontos = INSS 248,60 (IRRF isento)', () => {
    expect(r.totalDescontos).toBeCloseTo(248.6, 2);
  });
  it('líquido = 2.751,40', () => {
    expect(r.liquido).toBeCloseTo(2751.4, 2);
  });
  it('encargo = FGTS 8% = 240 (sem CPP no Simples I–III/V)', () => {
    expect(r.totalEncargos).toBeCloseTo(240, 2);
    expect(r.encargosEmpregador).toHaveLength(1);
  });
});

describe('Folha CLT — encargos fora do Simples (Lucro Presumido/Real)', () => {
  const r = calcularFolhaCLT(func({ salario: 3000 }), SEM_VARIAVEIS, '2026-06', {
    cppForaDoDAS: true,
    ratFap: 0.02,
  });
  it('inclui CPP 20% + RAT 2% + Terceiros 5,8% + FGTS 8%', () => {
    // 3000 × (0,20 + 0,02 + 0,058 + 0,08) = 3000 × 0,358 = 1.074
    expect(r.totalEncargos).toBeCloseTo(1074, 2);
    expect(r.encargosEmpregador).toHaveLength(4);
  });
});

describe('FGTS do aprendiz é 2%', () => {
  const r = calcularFolhaCLT(
    func({ salario: 1621, modalidade: 'Aprendiz' }),
    SEM_VARIAVEIS,
    '2026-06',
    { fgtsAprendiz: true },
  );
  it('FGTS = 1.621 × 2% = 32,42', () => {
    expect(r.totalEncargos).toBeCloseTo(32.42, 2);
  });
});
