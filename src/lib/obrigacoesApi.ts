// Acesso a `obrigacoes` no Supabase (mapeia snake_case ↔ camelCase).
import { supabase } from './supabase';
import type { Obrigacao, StatusObrigacao } from '@/data/types';

type Row = {
  id: string;
  empresa_id: string;
  titulo: string;
  tipo: string;
  competencia: string;
  vencimento: string | null;
  status: StatusObrigacao;
  responsavel_id: string | null;
  departamento: string | null;
  concluida_em: string | null;
};

const de = (r: Row): Obrigacao => ({
  id: r.id,
  empresaId: r.empresa_id,
  titulo: r.titulo,
  tipo: r.tipo as Obrigacao['tipo'],
  competencia: r.competencia,
  vencimento: r.vencimento ?? '',
  status: r.status,
  responsavelId: r.responsavel_id ?? '',
  departamento: (r.departamento ?? 'Fiscal') as Obrigacao['departamento'],
  concluidaEm: r.concluida_em ?? undefined,
});

export async function listarObrigacoes(): Promise<Obrigacao[]> {
  const { data, error } = await supabase.from('obrigacoes').select('*');
  if (error) throw error;
  return (data as Row[]).map(de);
}

export async function atualizarStatusObrigacaoApi(o: Obrigacao): Promise<void> {
  const { error } = await supabase
    .from('obrigacoes')
    .update({ status: o.status, concluida_em: o.concluidaEm ?? null })
    .eq('id', o.id);
  if (error) throw error;
}
