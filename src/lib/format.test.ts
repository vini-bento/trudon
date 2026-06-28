import { describe, it, expect } from 'vitest';
import {
  formatBRL,
  formatCNPJ,
  formatCPF,
  formatCompetencia,
  formatPercent,
  iniciais,
  mascaraCPF,
  mascaraCNPJ,
  mascaraRG,
} from './format';

describe('máscaras progressivas de documento', () => {
  it('CPF formata enquanto digita', () => {
    expect(mascaraCPF('123')).toBe('123');
    expect(mascaraCPF('1234567')).toBe('123.456.7');
    expect(mascaraCPF('12345678901')).toBe('123.456.789-01');
    // ignora não-dígitos e excesso
    expect(mascaraCPF('123.456.789-0123')).toBe('123.456.789-01');
  });
  it('CNPJ formata enquanto digita', () => {
    expect(mascaraCNPJ('12345')).toBe('12.345');
    expect(mascaraCNPJ('12345678000190')).toBe('12.345.678/0001-90');
  });
  it('RG formata enquanto digita', () => {
    expect(mascaraRG('12345678')).toBe('12.345.678');
    expect(mascaraRG('123456789')).toBe('12.345.678-9');
  });
});

describe('formatBRL', () => {
  it('formata moeda brasileira', () => {
    // usa espaço não separável ( ) entre símbolo e valor
    expect(formatBRL(1234.56)).toBe('R$ 1.234,56');
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
  it('trata valores inválidos como zero', () => {
    expect(formatBRL(NaN)).toBe('R$ 0,00');
  });
});

describe('formatCNPJ', () => {
  it('aplica a máscara correta', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('formatCPF', () => {
  it('aplica a máscara correta', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });
});

describe('formatCompetencia', () => {
  it('converte YYYY-MM em mmm/yyyy', () => {
    expect(formatCompetencia('2026-06')).toBe('jun/2026');
  });
});

describe('formatPercent', () => {
  it('formata percentual', () => {
    expect(formatPercent(12.5)).toBe('12,5%');
  });
});

describe('iniciais', () => {
  it('extrai iniciais de nome composto', () => {
    expect(iniciais('Vinícius Bento')).toBe('VB');
    expect(iniciais('Ana')).toBe('AN');
  });
});
