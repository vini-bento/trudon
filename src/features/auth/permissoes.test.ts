import { describe, it, expect } from 'vitest';
import { podeAcessar, areaInicial, type Area } from './permissoes';
import type { UsuarioLogado } from '@/features/ia/useAuth';

const TODAS: Area[] = [
  'dashboard',
  'empresas',
  'contabilidade',
  'fiscal',
  'folha',
  'honorarios',
  'obrigacoes',
  'portal',
  'config',
];

function u(over: Partial<UsuarioLogado>): UsuarioLogado {
  return {
    nome: 'X',
    email: 'x@x.com',
    iniciais: 'X',
    dono: false,
    papel: 'equipe',
    permissoes: [],
    empresaId: null,
    ...over,
  };
}

describe('podeAcessar', () => {
  it('sem usuário → nega tudo', () => {
    expect(TODAS.every((a) => !podeAcessar(a, null))).toBe(true);
  });

  it('dono → acesso total', () => {
    const dono = u({ dono: true });
    expect(TODAS.every((a) => podeAcessar(a, dono))).toBe(true);
  });

  it('cliente → só portal', () => {
    const cli = u({ papel: 'cliente', empresaId: 'e1' });
    expect(podeAcessar('portal', cli)).toBe(true);
    expect(
      TODAS.filter((a) => a !== 'portal').every((a) => !podeAcessar(a, cli)),
    ).toBe(true);
  });

  it('equipe sem permissões → só dashboard', () => {
    const eq = u({});
    expect(podeAcessar('dashboard', eq)).toBe(true);
    expect(podeAcessar('fiscal', eq)).toBe(false);
    expect(podeAcessar('config', eq)).toBe(false);
  });

  it('equipe com permissão específica → vê só aquela área (+ dashboard)', () => {
    const eq = u({ permissoes: ['fiscal', 'folha'] });
    expect(podeAcessar('fiscal', eq)).toBe(true);
    expect(podeAcessar('folha', eq)).toBe(true);
    expect(podeAcessar('honorarios', eq)).toBe(false);
    expect(podeAcessar('config', eq)).toBe(false); // nunca, sem ser dono
  });

  it('config é só de dono', () => {
    expect(podeAcessar('config', u({ permissoes: ['config'] }))).toBe(false);
    expect(podeAcessar('config', u({ dono: true }))).toBe(true);
  });

  it('areaInicial: cliente → portal; equipe/dono → dashboard', () => {
    expect(areaInicial(u({ papel: 'cliente' }))).toBe('portal');
    expect(areaInicial(u({}))).toBe('dashboard');
    expect(areaInicial(null)).toBe('dashboard');
  });
});
