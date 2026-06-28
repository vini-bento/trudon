// Acesso a `lancamentos` no Supabase (mapeia snake_case ↔ camelCase).
import { supabase } from './supabase';
import type { Lancamento } from '@/data/types';

type Row = {
  id: string;
  empresa_id: string;
  data: string;
  historico: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number | string;
  centro_custo: string | null;
};

const de = (r: Row): Lancamento => ({
  id: r.id,
  empresaId: r.empresa_id,
  data: r.data,
  historico: r.historico,
  contaDebitoId: r.conta_debito_id,
  contaCreditoId: r.conta_credito_id,
  valor: Number(r.valor),
  centroCusto: r.centro_custo ?? undefined,
});

const paraRow = (l: Lancamento) => ({
  id: l.id,
  empresa_id: l.empresaId,
  data: l.data,
  historico: l.historico,
  conta_debito_id: l.contaDebitoId,
  conta_credito_id: l.contaCreditoId,
  valor: l.valor,
  centro_custo: l.centroCusto ?? null,
});

export async function listarLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('data', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(de);
}

export async function inserirLancamento(l: Lancamento): Promise<void> {
  const { error } = await supabase.from('lancamentos').insert(paraRow(l));
  if (error) throw error;
}

export async function removerLancamentoApi(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id);
  if (error) throw error;
}
