// Testes do quadro de pessoal por categoria.
// A regra de negócio central é a derivação de "possui folha de pagamento":
// empresas com qualquer vínculo CLT, pró-labore, estagiário, jovem aprendiz ou
// doméstico têm folha (e, portanto, obrigações como eSocial/FGTS Digital).
// Autônomo/RPA (contribuinte individual) NÃO gera folha.
import { describe, it, expect } from 'vitest';
import { possuiFolhaDePagamento, totalVinculos } from './quadro';
import type { VinculoQuantidade } from './tipos';

const v = (
  categoria: VinculoQuantidade['categoria'],
  quantidade: number,
): VinculoQuantidade => ({ categoria, quantidade });

describe('possuiFolhaDePagamento', () => {
  it('quadro vazio → não possui folha', () => {
    expect(possuiFolhaDePagamento([])).toBe(false);
  });

  it('somente autônomo/RPA → não possui folha (contribuinte individual)', () => {
    expect(possuiFolhaDePagamento([v('autonomo_rpa', 5)])).toBe(false);
  });

  it('1 empregado CLT → possui folha', () => {
    expect(possuiFolhaDePagamento([v('clt', 1)])).toBe(true);
  });

  it('sócio com pró-labore → possui folha', () => {
    expect(possuiFolhaDePagamento([v('pro_labore', 1)])).toBe(true);
  });

  it('somente estagiário → possui folha', () => {
    expect(possuiFolhaDePagamento([v('estagiario', 2)])).toBe(true);
  });

  it('somente jovem aprendiz → possui folha', () => {
    expect(possuiFolhaDePagamento([v('jovem_aprendiz', 1)])).toBe(true);
  });

  it('somente empregado doméstico → possui folha', () => {
    expect(possuiFolhaDePagamento([v('domestico', 1)])).toBe(true);
  });

  it('categoria de folha com quantidade 0 → não possui folha', () => {
    expect(possuiFolhaDePagamento([v('clt', 0), v('autonomo_rpa', 3)])).toBe(false);
  });

  it('mistura de RPA (gera folha=não) com CLT (gera folha=sim) → possui folha', () => {
    expect(possuiFolhaDePagamento([v('autonomo_rpa', 4), v('clt', 2)])).toBe(true);
  });
});

describe('totalVinculos', () => {
  it('quadro vazio → 0', () => {
    expect(totalVinculos([])).toBe(0);
  });

  it('soma as quantidades de todas as categorias', () => {
    const quadro = [v('clt', 3), v('estagiario', 2), v('autonomo_rpa', 1)];
    expect(totalVinculos(quadro)).toBe(6);
  });

  it('ignora quantidades negativas (tratadas como 0)', () => {
    expect(totalVinculos([v('clt', 3), v('domestico', -2)])).toBe(3);
  });
});
