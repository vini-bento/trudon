// Acesso a `contratos` e `cobrancas` no Supabase (mapeia snake_case ↔ camelCase).
import { supabase } from './supabase';
import type { Cobranca, Contrato } from '@/data/types';

type ContratoRow = {
  id: string;
  empresa_id: string;
  descricao: string;
  valor_mensal: number | string;
  dia_vencimento: number;
  ativo: boolean;
  inicio_em: string | null;
};

type CobrancaRow = {
  id: string;
  empresa_id: string;
  contrato_id: string | null;
  competencia: string;
  vencimento: string | null;
  valor: number | string;
  status: Cobranca['status'];
  pago_em: string | null;
};

const contratoDe = (r: ContratoRow): Contrato => ({
  id: r.id,
  empresaId: r.empresa_id,
  descricao: r.descricao,
  valorMensal: Number(r.valor_mensal),
  diaVencimento: r.dia_vencimento,
  ativo: r.ativo,
  inicioEm: r.inicio_em ?? '',
});

const cobrancaDe = (r: CobrancaRow): Cobranca => ({
  id: r.id,
  empresaId: r.empresa_id,
  contratoId: r.contrato_id ?? '',
  competencia: r.competencia,
  vencimento: r.vencimento ?? '',
  valor: Number(r.valor),
  status: r.status,
  pagoEm: r.pago_em ?? undefined,
});

export async function listarContratos(): Promise<Contrato[]> {
  const { data, error } = await supabase.from('contratos').select('*');
  if (error) throw error;
  return (data as ContratoRow[]).map(contratoDe);
}

export async function listarCobrancas(): Promise<Cobranca[]> {
  const { data, error } = await supabase.from('cobrancas').select('*');
  if (error) throw error;
  return (data as CobrancaRow[]).map(cobrancaDe);
}

/** Atualiza status e data de pagamento de uma cobrança. */
export async function atualizarCobrancaApi(c: Cobranca): Promise<void> {
  const { error } = await supabase
    .from('cobrancas')
    .update({ status: c.status, pago_em: c.pagoEm ?? null })
    .eq('id', c.id);
  if (error) throw error;
}
