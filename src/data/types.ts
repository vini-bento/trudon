// Modelo de domínio do Trudon ERP.
// Tipos centrais compartilhados por todos os módulos.

export type RegimeTributario =
  | 'Simples Nacional'
  | 'Lucro Presumido'
  | 'Lucro Real'
  | 'MEI';

export type SituacaoEmpresa = 'Ativa' | 'Suspensa' | 'Baixada';

export interface Socio {
  nome: string;
  cpf: string;
  participacao: number; // percentual 0-100
}

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regime: RegimeTributario;
  situacao: SituacaoEmpresa;
  segmento: string;
  // Endereço completo (padrão brasileiro)
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  aberturaEm: string; // ISO date
  email: string;
  telefone: string;
  responsavelId: string; // usuário do escritório
  socios: Socio[];
}

export type TipoConta =
  | 'Ativo'
  | 'Passivo'
  | 'Patrimônio Líquido'
  | 'Receita'
  | 'Despesa';

export type NaturezaConta = 'Devedora' | 'Credora';

export interface ContaContabil {
  id: string;
  codigo: string; // ex.: "1.1.01.001"
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  analitica: boolean; // true = aceita lançamento; false = conta de grupo
}

export interface Lancamento {
  id: string;
  empresaId: string;
  data: string; // ISO date
  historico: string;
  contaDebitoId: string;
  contaCreditoId: string;
  valor: number; // sempre positivo, em reais
  centroCusto?: string;
}

export type StatusCobranca = 'Pago' | 'Pendente' | 'Atrasado';

export interface Contrato {
  id: string;
  empresaId: string;
  descricao: string;
  valorMensal: number;
  diaVencimento: number; // 1-28
  ativo: boolean;
  inicioEm: string; // ISO date
}

export interface Cobranca {
  id: string;
  empresaId: string;
  contratoId: string;
  competencia: string; // "YYYY-MM"
  vencimento: string; // ISO date
  valor: number;
  status: StatusCobranca;
  pagoEm?: string; // ISO date
}

export type TipoObrigacao =
  | 'Fiscal'
  | 'Contábil'
  | 'Trabalhista'
  | 'Societário';

export type StatusObrigacao =
  | 'Pendente'
  | 'Em andamento'
  | 'Concluída'
  | 'Atrasada';

export type Departamento =
  | 'Fiscal'
  | 'Contábil'
  | 'Pessoal'
  | 'Societário'
  | 'Financeiro';

export interface Obrigacao {
  id: string;
  empresaId: string;
  titulo: string;
  tipo: TipoObrigacao;
  competencia: string; // "YYYY-MM"
  vencimento: string; // ISO date
  status: StatusObrigacao;
  responsavelId: string;
  departamento: Departamento;
  concluidaEm?: string;
}

export type TipoDocumento =
  | 'Guia'
  | 'Balancete'
  | 'Folha'
  | 'Nota Fiscal'
  | 'Relatório'
  | 'Contrato'
  | 'Outro';

export interface Documento {
  id: string;
  empresaId: string;
  nome: string;
  tipo: TipoDocumento;
  competencia: string; // "YYYY-MM"
  publicadoEm: string; // ISO date
  tamanhoKb: number;
  protocolo: string;
  visualizado: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: Departamento;
  iniciais: string;
}
