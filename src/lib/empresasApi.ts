// Acesso a `empresas` no Supabase. Mapeia entre a linha do banco (snake_case)
// e o tipo Empresa do app (camelCase). Resiliente: o chamador decide o que
// fazer em caso de erro (ex.: cair em modo local).
import { supabase } from './supabase';
import type { Empresa } from '@/data/types';

type Row = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  regime: string;
  situacao: string;
  segmento: string | null;
  cidade: string | null;
  uf: string | null;
  abertura_em: string | null;
  email: string | null;
  telefone: string | null;
  responsavel_id: string | null;
  socios: Empresa['socios'] | null;
};

function paraEmpresa(r: Row): Empresa {
  return {
    id: r.id,
    razaoSocial: r.razao_social,
    nomeFantasia: r.nome_fantasia,
    cnpj: r.cnpj,
    regime: r.regime as Empresa['regime'],
    situacao: r.situacao as Empresa['situacao'],
    segmento: r.segmento ?? '',
    cidade: r.cidade ?? '',
    uf: r.uf ?? '',
    aberturaEm: r.abertura_em ?? '',
    email: r.email ?? '',
    telefone: r.telefone ?? '',
    responsavelId: r.responsavel_id ?? '',
    socios: r.socios ?? [],
  };
}

function paraRow(e: Empresa): Row {
  return {
    id: e.id,
    razao_social: e.razaoSocial,
    nome_fantasia: e.nomeFantasia,
    cnpj: e.cnpj,
    regime: e.regime,
    situacao: e.situacao,
    segmento: e.segmento,
    cidade: e.cidade,
    uf: e.uf,
    abertura_em: e.aberturaEm || null,
    email: e.email,
    telefone: e.telefone,
    responsavel_id: e.responsavelId,
    socios: e.socios,
  };
}

export async function listarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nome_fantasia');
  if (error) throw error;
  return (data as Row[]).map(paraEmpresa);
}

export async function inserirEmpresa(e: Empresa): Promise<void> {
  const { error } = await supabase.from('empresas').insert(paraRow(e));
  if (error) throw error;
}

export async function atualizarEmpresaApi(e: Empresa): Promise<void> {
  const { error } = await supabase
    .from('empresas')
    .update(paraRow(e))
    .eq('id', e.id);
  if (error) throw error;
}

export async function removerEmpresaApi(id: string): Promise<void> {
  const { error } = await supabase.from('empresas').delete().eq('id', id);
  if (error) throw error;
}
