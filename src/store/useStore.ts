// Estado global do Trudon ERP.
// Mantém todos os dados em memória, persistidos no localStorage do navegador.
// NOTA DE ARQUITETURA: nesta fase (demo), os dados ficam no navegador apenas
// com dados fictícios. A camada de persistência está isolada aqui para que,
// na fase de produção, seja substituída por uma API segura sem alterar a UI.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Cobranca,
  Contrato,
  Documento,
  Empresa,
  Lancamento,
  Obrigacao,
  StatusObrigacao,
} from '@/data/types';
import {
  cobrancas as seedCobrancas,
  contratos as seedContratos,
  documentos as seedDocumentos,
  empresas as seedEmpresas,
  lancamentos as seedLancamentos,
  obrigacoes as seedObrigacoes,
} from '@/data/seed';

const SEED_VERSION = 3;

interface State {
  seedVersion: number;
  empresas: Empresa[];
  lancamentos: Lancamento[];
  contratos: Contrato[];
  cobrancas: Cobranca[];
  obrigacoes: Obrigacao[];
  documentos: Documento[];

  // Empresas
  definirEmpresas: (lista: Empresa[]) => void;
  adicionarEmpresa: (e: Empresa) => void;
  atualizarEmpresa: (id: string, dados: Partial<Empresa>) => void;
  removerEmpresa: (id: string) => void;

  // Lançamentos
  adicionarLancamento: (l: Lancamento) => void;
  removerLancamento: (id: string) => void;

  // Honorários
  definirContratos: (lista: Contrato[]) => void;
  definirCobrancas: (lista: Cobranca[]) => void;
  alternarPagamento: (id: string) => void;

  // Obrigações
  definirStatusObrigacao: (id: string, status: StatusObrigacao) => void;

  // Documentos
  marcarDocumentoVisualizado: (id: string) => void;

  restaurarExemplo: () => void;
}

function dadosIniciais() {
  return {
    seedVersion: SEED_VERSION,
    empresas: seedEmpresas,
    lancamentos: seedLancamentos,
    contratos: seedContratos,
    cobrancas: seedCobrancas,
    obrigacoes: seedObrigacoes,
    documentos: seedDocumentos,
  };
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...dadosIniciais(),

      definirEmpresas: (lista) => set({ empresas: lista }),

      adicionarEmpresa: (e) =>
        set((s) => ({ empresas: [e, ...s.empresas] })),

      atualizarEmpresa: (id, dados) =>
        set((s) => ({
          empresas: s.empresas.map((e) => (e.id === id ? { ...e, ...dados } : e)),
        })),

      removerEmpresa: (id) =>
        set((s) => ({
          empresas: s.empresas.filter((e) => e.id !== id),
          lancamentos: s.lancamentos.filter((l) => l.empresaId !== id),
          contratos: s.contratos.filter((c) => c.empresaId !== id),
          cobrancas: s.cobrancas.filter((c) => c.empresaId !== id),
          obrigacoes: s.obrigacoes.filter((o) => o.empresaId !== id),
          documentos: s.documentos.filter((d) => d.empresaId !== id),
        })),

      adicionarLancamento: (l) =>
        set((s) => ({ lancamentos: [l, ...s.lancamentos] })),

      removerLancamento: (id) =>
        set((s) => ({ lancamentos: s.lancamentos.filter((l) => l.id !== id) })),

      definirContratos: (lista) => set({ contratos: lista }),
      definirCobrancas: (lista) => set({ cobrancas: lista }),

      alternarPagamento: (id) =>
        set((s) => ({
          cobrancas: s.cobrancas.map((c) => {
            if (c.id !== id) return c;
            const pago = c.status === 'Pago';
            return {
              ...c,
              status: pago ? 'Pendente' : 'Pago',
              pagoEm: pago ? undefined : new Date().toISOString().slice(0, 10),
            };
          }),
        })),

      definirStatusObrigacao: (id, status) =>
        set((s) => ({
          obrigacoes: s.obrigacoes.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  concluidaEm:
                    status === 'Concluída'
                      ? new Date().toISOString().slice(0, 10)
                      : undefined,
                }
              : o,
          ),
        })),

      marcarDocumentoVisualizado: (id) =>
        set((s) => ({
          documentos: s.documentos.map((d) =>
            d.id === id ? { ...d, visualizado: true } : d,
          ),
        })),

      restaurarExemplo: () => set({ ...dadosIniciais() }),
    }),
    {
      name: 'trudon-erp',
      version: SEED_VERSION,
      // Recarrega os dados-semente quando a versão do schema muda.
      migrate: () => ({ ...dadosIniciais() }) as State,
    },
  ),
);
