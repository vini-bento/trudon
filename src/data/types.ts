// Modelo de domínio do Trudon ERP.
// Tipos centrais compartilhados por todos os módulos.

export type RegimeTributario =
  | 'Simples Nacional'
  | 'Lucro Presumido'
  | 'Lucro Real'
  | 'MEI';

export type SituacaoEmpresa = 'Ativa' | 'Suspensa' | 'Baixada';

export type TipoPessoa = 'PJ' | 'PF';

export interface Socio {
  nome: string;
  cpf: string;
  participacao: number; // percentual 0-100
  qualificacao: string; // ex.: Sócio-administrador, Sócio, Administrador
}

// Pessoa de contato dentro do cliente (quem o escritório aciona).
export interface Contato {
  nome: string;
  cargo: string; // função/área (ex.: Financeiro, Fiscal, Sócio)
  email: string;
  telefone: string;
  principal: boolean;
}

// Cliente do escritório — Pessoa Jurídica (PJ) ou Pessoa Física (PF).
// A entidade chama-se "Empresa" por herança, mas representa o CLIENTE.
export interface Empresa {
  id: string;
  tipoPessoa: TipoPessoa;

  // Identificação PJ
  razaoSocial: string; // PF: recebe o nome completo
  nomeFantasia: string; // PF: recebe o nome completo (usado como rótulo)
  cnpj: string;
  inscricaoEstadual: string;
  isentoIE: boolean;
  inscricaoMunicipal: string;
  cnae: string;
  naturezaJuridica: string;

  // Identificação PF
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataNascimento: string; // ISO date
  profissao: string;

  // Comum
  regime: RegimeTributario;
  situacao: SituacaoEmpresa;
  segmento: string; // atividade
  aberturaEm: string; // ISO date (PJ)

  // Endereço completo (padrão brasileiro)
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;

  // Contatos (quem o escritório aciona)
  contatos: Contato[];

  // Acessos governamentais (preparados; preenchidos depois)
  certificadoTipo: '' | 'A1' | 'A3';
  certificadoValidade: string; // ISO date
  ecacValidade: string; // validade da procuração e-CAC (ISO date)

  // Dados bancários
  bancoCodigo: string;
  agencia: string;
  conta: string;
  tipoConta: '' | 'Corrente' | 'Poupança';
  pix: string;

  // Contato direto legado / principal
  email: string;
  telefone: string;

  // Interno
  responsavelId: string; // usuário do escritório
  observacoes: string;
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
