// Núcleo contábil: cálculo de saldos, balancete e DRE a partir de lançamentos
// de partidas dobradas. Esta é a área mais sensível do sistema — toda regra
// aqui é coberta por testes (accounting.test.ts).
import type { ContaContabil, Lancamento } from '@/data/types';

export interface MovimentoConta {
  debito: number;
  credito: number;
}

/**
 * Soma débitos e créditos por conta a partir dos lançamentos.
 * Cada lançamento debita uma conta e credita outra pelo mesmo valor
 * (partida dobrada), portanto o total de débitos sempre iguala o de créditos.
 */
export function movimentosPorConta(
  lancamentos: Lancamento[],
): Map<string, MovimentoConta> {
  const mapa = new Map<string, MovimentoConta>();
  const garantir = (id: string): MovimentoConta => {
    let m = mapa.get(id);
    if (!m) {
      m = { debito: 0, credito: 0 };
      mapa.set(id, m);
    }
    return m;
  };
  for (const l of lancamentos) {
    const valor = arredondar(l.valor);
    if (valor <= 0) continue;
    garantir(l.contaDebitoId).debito += valor;
    garantir(l.contaCreditoId).credito += valor;
  }
  return mapa;
}

/**
 * Saldo de uma conta respeitando sua natureza.
 * - Contas devedoras (Ativo, Despesa): saldo = débito − crédito.
 * - Contas credoras (Passivo, PL, Receita): saldo = crédito − débito.
 */
export function saldoConta(conta: ContaContabil, mov: MovimentoConta): number {
  const { debito, credito } = mov;
  const saldo =
    conta.natureza === 'Devedora' ? debito - credito : credito - debito;
  return arredondar(saldo);
}

export interface LinhaBalancete {
  conta: ContaContabil;
  debito: number;
  credito: number;
  saldo: number;
}

/** Gera o balancete (apenas contas analíticas com movimento). */
export function gerarBalancete(
  contas: ContaContabil[],
  lancamentos: Lancamento[],
): LinhaBalancete[] {
  const mov = movimentosPorConta(lancamentos);
  return contas
    .filter((c) => c.analitica)
    .map((conta) => {
      const m = mov.get(conta.id) ?? { debito: 0, credito: 0 };
      return {
        conta,
        debito: arredondar(m.debito),
        credito: arredondar(m.credito),
        saldo: saldoConta(conta, m),
      };
    })
    .filter((linha) => linha.debito !== 0 || linha.credito !== 0)
    .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo));
}

export interface TotaisBalancete {
  totalDebito: number;
  totalCredito: number;
  balanceado: boolean;
}

/** Totais do balancete — débitos e créditos devem fechar. */
export function totaisBalancete(linhas: LinhaBalancete[]): TotaisBalancete {
  const totalDebito = arredondar(
    linhas.reduce((acc, l) => acc + l.debito, 0),
  );
  const totalCredito = arredondar(
    linhas.reduce((acc, l) => acc + l.credito, 0),
  );
  return {
    totalDebito,
    totalCredito,
    balanceado: Math.abs(totalDebito - totalCredito) < 0.005,
  };
}

export interface ResultadoDRE {
  receitaBruta: number;
  despesasTotais: number;
  resultado: number; // lucro (>0) ou prejuízo (<0)
  margem: number; // resultado / receita (%)
  linhasReceita: LinhaBalancete[];
  linhasDespesa: LinhaBalancete[];
}

/**
 * Demonstração do Resultado simplificada: total de receitas menos
 * total de despesas no conjunto de lançamentos informado.
 */
export function gerarDRE(
  contas: ContaContabil[],
  lancamentos: Lancamento[],
): ResultadoDRE {
  const balancete = gerarBalancete(contas, lancamentos);
  const linhasReceita = balancete.filter((l) => l.conta.tipo === 'Receita');
  const linhasDespesa = balancete.filter((l) => l.conta.tipo === 'Despesa');

  const receitaBruta = arredondar(
    linhasReceita.reduce((acc, l) => acc + l.saldo, 0),
  );
  const despesasTotais = arredondar(
    linhasDespesa.reduce((acc, l) => acc + l.saldo, 0),
  );
  const resultado = arredondar(receitaBruta - despesasTotais);
  const margem = receitaBruta > 0 ? (resultado / receitaBruta) * 100 : 0;

  return {
    receitaBruta,
    despesasTotais,
    resultado,
    margem: arredondar(margem),
    linhasReceita,
    linhasDespesa,
  };
}

/** Arredonda para 2 casas evitando ruído de ponto flutuante. */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
