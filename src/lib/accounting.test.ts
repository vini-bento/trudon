import { describe, it, expect } from 'vitest';
import {
  movimentosPorConta,
  saldoConta,
  gerarBalancete,
  totaisBalancete,
  gerarDRE,
  arredondar,
} from './accounting';
import type { ContaContabil, Lancamento } from '@/data/types';

const contas: ContaContabil[] = [
  { id: 'caixa', codigo: '1.1.01.001', nome: 'Caixa', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'banco', codigo: '1.1.01.002', nome: 'Banco', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'capital', codigo: '2.3.01.001', nome: 'Capital Social', tipo: 'Patrimônio Líquido', natureza: 'Credora', analitica: true },
  { id: 'receita', codigo: '3.1.01.001', nome: 'Receita de Serviços', tipo: 'Receita', natureza: 'Credora', analitica: true },
  { id: 'despesa', codigo: '4.1.01.001', nome: 'Despesa com Salários', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
  { id: 'grupo', codigo: '1', nome: 'Ativo', tipo: 'Ativo', natureza: 'Devedora', analitica: false },
];

const lancamentos: Lancamento[] = [
  // Integralização de capital: Banco (D) / Capital (C) 100.000
  { id: 'l1', empresaId: 'e1', data: '2026-06-01', historico: 'Capital', contaDebitoId: 'banco', contaCreditoId: 'capital', valor: 100000 },
  // Receita recebida em caixa: Caixa (D) / Receita (C) 8.000
  { id: 'l2', empresaId: 'e1', data: '2026-06-10', historico: 'Serviço', contaDebitoId: 'caixa', contaCreditoId: 'receita', valor: 8000 },
  // Pagamento de salário: Despesa (D) / Banco (C) 3.000
  { id: 'l3', empresaId: 'e1', data: '2026-06-20', historico: 'Salário', contaDebitoId: 'despesa', contaCreditoId: 'banco', valor: 3000 },
];

describe('movimentosPorConta', () => {
  it('soma débitos e créditos por conta', () => {
    const mov = movimentosPorConta(lancamentos);
    expect(mov.get('banco')).toEqual({ debito: 100000, credito: 3000 });
    expect(mov.get('caixa')).toEqual({ debito: 8000, credito: 0 });
    expect(mov.get('receita')).toEqual({ debito: 0, credito: 8000 });
  });

  it('ignora valores não positivos', () => {
    const mov = movimentosPorConta([
      { id: 'x', empresaId: 'e1', data: '2026-06-01', historico: '', contaDebitoId: 'caixa', contaCreditoId: 'banco', valor: 0 },
      { id: 'y', empresaId: 'e1', data: '2026-06-01', historico: '', contaDebitoId: 'caixa', contaCreditoId: 'banco', valor: -50 },
    ]);
    expect(mov.size).toBe(0);
  });
});

describe('saldoConta', () => {
  it('conta devedora: saldo = débito − crédito', () => {
    const conta = contas.find((c) => c.id === 'banco')!;
    expect(saldoConta(conta, { debito: 100000, credito: 3000 })).toBe(97000);
  });

  it('conta credora: saldo = crédito − débito', () => {
    const conta = contas.find((c) => c.id === 'receita')!;
    expect(saldoConta(conta, { debito: 0, credito: 8000 })).toBe(8000);
  });
});

describe('gerarBalancete', () => {
  it('lista apenas contas analíticas com movimento, ordenadas por código', () => {
    const linhas = gerarBalancete(contas, lancamentos);
    expect(linhas.map((l) => l.conta.id)).toEqual([
      'caixa',
      'banco',
      'capital',
      'receita',
      'despesa',
    ]);
    // conta de grupo (não analítica) não aparece
    expect(linhas.some((l) => l.conta.id === 'grupo')).toBe(false);
  });

  it('balancete fecha: total de débitos = total de créditos', () => {
    const linhas = gerarBalancete(contas, lancamentos);
    const totais = totaisBalancete(linhas);
    expect(totais.totalDebito).toBe(111000);
    expect(totais.totalCredito).toBe(111000);
    expect(totais.balanceado).toBe(true);
  });
});

describe('gerarDRE', () => {
  it('calcula resultado = receitas − despesas', () => {
    const dre = gerarDRE(contas, lancamentos);
    expect(dre.receitaBruta).toBe(8000);
    expect(dre.despesasTotais).toBe(3000);
    expect(dre.resultado).toBe(5000);
    expect(dre.margem).toBe(62.5);
  });

  it('margem é 0 quando não há receita', () => {
    const dre = gerarDRE(contas, [lancamentos[2]]);
    expect(dre.receitaBruta).toBe(0);
    expect(dre.margem).toBe(0);
    expect(dre.resultado).toBe(-3000);
  });
});

describe('arredondar', () => {
  it('elimina ruído de ponto flutuante', () => {
    expect(arredondar(0.1 + 0.2)).toBe(0.3);
    expect(arredondar(1234.565)).toBe(1234.57);
  });
});
