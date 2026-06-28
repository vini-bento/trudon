// Acesso a `empresas` (clientes PF/PJ) no Supabase.
// Mapeia entre a linha do banco (snake_case) e o tipo Empresa (camelCase).
import { supabase } from './supabase';
import type { Empresa, Contato, Socio } from '@/data/types';

type Row = {
  id: string;
  tipo_pessoa: string | null;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string | null;
  inscricao_estadual: string | null;
  isento_ie: boolean | null;
  inscricao_municipal: string | null;
  cnae: string | null;
  natureza_juridica: string | null;
  cpf: string | null;
  rg: string | null;
  orgao_emissor: string | null;
  data_nascimento: string | null;
  profissao: string | null;
  regime: string;
  situacao: string;
  segmento: string | null;
  abertura_em: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  contatos: Contato[] | null;
  certificado_tipo: string | null;
  certificado_validade: string | null;
  ecac_validade: string | null;
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  pix: string | null;
  email: string | null;
  telefone: string | null;
  responsavel_id: string | null;
  observacoes: string | null;
  socios:
    | Array<{ nome: string; cpf: string; participacao: number; qualificacao?: string }>
    | null;
};

function paraEmpresa(r: Row): Empresa {
  const socios: Socio[] = (r.socios ?? []).map((s) => ({
    nome: s.nome,
    cpf: s.cpf,
    participacao: s.participacao,
    qualificacao: s.qualificacao ?? '',
  }));
  return {
    id: r.id,
    tipoPessoa: (r.tipo_pessoa as Empresa['tipoPessoa']) ?? 'PJ',
    razaoSocial: r.razao_social,
    nomeFantasia: r.nome_fantasia,
    cnpj: r.cnpj ?? '',
    inscricaoEstadual: r.inscricao_estadual ?? '',
    isentoIE: r.isento_ie ?? false,
    inscricaoMunicipal: r.inscricao_municipal ?? '',
    cnae: r.cnae ?? '',
    naturezaJuridica: r.natureza_juridica ?? '',
    cpf: r.cpf ?? '',
    rg: r.rg ?? '',
    orgaoEmissor: r.orgao_emissor ?? '',
    dataNascimento: r.data_nascimento ?? '',
    profissao: r.profissao ?? '',
    regime: r.regime as Empresa['regime'],
    situacao: r.situacao as Empresa['situacao'],
    segmento: r.segmento ?? '',
    aberturaEm: r.abertura_em ?? '',
    cep: r.cep ?? '',
    logradouro: r.logradouro ?? '',
    numero: r.numero ?? '',
    complemento: r.complemento ?? '',
    bairro: r.bairro ?? '',
    cidade: r.cidade ?? '',
    uf: r.uf ?? '',
    contatos: r.contatos ?? [],
    certificadoTipo: (r.certificado_tipo as Empresa['certificadoTipo']) ?? '',
    certificadoValidade: r.certificado_validade ?? '',
    ecacValidade: r.ecac_validade ?? '',
    bancoCodigo: r.banco_codigo ?? '',
    agencia: r.agencia ?? '',
    conta: r.conta ?? '',
    tipoConta: (r.tipo_conta as Empresa['tipoConta']) ?? '',
    pix: r.pix ?? '',
    email: r.email ?? '',
    telefone: r.telefone ?? '',
    responsavelId: r.responsavel_id ?? '',
    observacoes: r.observacoes ?? '',
    socios,
  };
}

function paraRow(e: Empresa) {
  return {
    id: e.id,
    tipo_pessoa: e.tipoPessoa,
    razao_social: e.razaoSocial,
    nome_fantasia: e.nomeFantasia,
    cnpj: e.cnpj || null,
    inscricao_estadual: e.inscricaoEstadual,
    isento_ie: e.isentoIE,
    inscricao_municipal: e.inscricaoMunicipal,
    cnae: e.cnae,
    natureza_juridica: e.naturezaJuridica,
    cpf: e.cpf || null,
    rg: e.rg,
    orgao_emissor: e.orgaoEmissor,
    data_nascimento: e.dataNascimento || null,
    profissao: e.profissao,
    regime: e.regime,
    situacao: e.situacao,
    segmento: e.segmento,
    abertura_em: e.aberturaEm || null,
    cep: e.cep,
    logradouro: e.logradouro,
    numero: e.numero,
    complemento: e.complemento,
    bairro: e.bairro,
    cidade: e.cidade,
    uf: e.uf,
    contatos: e.contatos,
    certificado_tipo: e.certificadoTipo || null,
    certificado_validade: e.certificadoValidade || null,
    ecac_validade: e.ecacValidade || null,
    banco_codigo: e.bancoCodigo,
    agencia: e.agencia,
    conta: e.conta,
    tipo_conta: e.tipoConta || null,
    pix: e.pix,
    email: e.email,
    telefone: e.telefone,
    responsavel_id: e.responsavelId,
    observacoes: e.observacoes,
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
