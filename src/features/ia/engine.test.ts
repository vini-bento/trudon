import { describe, it, expect } from 'vitest';
import { responder, type ContextoIA } from './engine';
import { buscarConhecimento } from './knowledge';

const ctxVazio: ContextoIA = {
  empresas: [],
  lancamentos: [],
  cobrancas: [],
  obrigacoes: [],
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

describe('buscarConhecimento', () => {
  it('reconhece Simples Nacional', () => {
    expect(buscarConhecimento(norm('o que é o simples nacional?'))?.id).toBe('simples');
  });

  it('reconhece partidas dobradas', () => {
    expect(buscarConhecimento(norm('como funcionam as partidas dobradas'))?.id).toBe(
      'partidas-dobradas',
    );
  });

  it('distingue ICMS de ISS', () => {
    expect(buscarConhecimento(norm('diferença entre icms e iss'))?.id).toBe('icms-iss');
  });

  it('retorna null quando não há tema reconhecível', () => {
    expect(buscarConhecimento(norm('qual a previsão do tempo amanhã'))).toBeNull();
  });
});

describe('responder — conhecimento contábil', () => {
  it('responde sobre o Simples e inclui a ressalva fiscal', () => {
    const r = responder('me explica o Simples Nacional', ctxVazio);
    expect(r.texto).toContain('Simples Nacional');
    expect(r.texto).toContain('R$ 4,8 milhões');
    expect(r.texto).toContain('legislação vigente');
  });

  it('responde conceito sem ressalva fiscal (partidas dobradas)', () => {
    const r = responder('o que são partidas dobradas?', ctxVazio);
    expect(r.texto).toContain('débito');
    expect(r.texto).not.toContain('legislação vigente');
  });

  it('cai no fallback para perguntas fora de escopo', () => {
    const r = responder('qual a previsão do tempo?', ctxVazio);
    expect(r.texto.toLowerCase()).toContain('não tenho uma resposta');
  });
});
