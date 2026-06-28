// Tipos do módulo de Folha / Departamento Pessoal.
import { round2, type PassoCalculo } from '@/lib/fiscal/tipos';

export { round2 };
export type { PassoCalculo };

// Todas as formas legais de contratação. O seletor de modalidade no cadastro
// governa quais regras de cálculo e obrigações se aplicam.
export type Modalidade =
  | 'CLT'
  | 'Experiência'
  | 'Intermitente'
  | 'Temporário'
  | 'Aprendiz'
  | 'Estagiário'
  | 'Autônomo (RPA)'
  | 'Pró-labore'
  | 'PJ'
  | 'Doméstico';

// Modalidades cujo pagamento é processado como FOLHA (vínculo CLT e afins).
export const MODALIDADES_FOLHA: Modalidade[] = [
  'CLT',
  'Experiência',
  'Intermitente',
  'Temporário',
  'Aprendiz',
  'Doméstico',
];

export type GrauInsalubridade = '' | 'minimo' | 'medio' | 'maximo';

// Cadastro de pessoa contratada (empregado ou prestador), vinculada a uma empresa.
export interface Funcionario {
  id: string;
  empresaId: string;
  nome: string;
  cpf: string;
  modalidade: Modalidade;
  cargo: string;
  dataAdmissao: string; // ISO date
  salario: number; // salário base mensal (ou bolsa/valor do serviço)
  dependentes: number; // para o IRRF
  // Configuração de adicionais (padrão CLT, ajustável por convenção coletiva)
  insalubridadeGrau: GrauInsalubridade;
  periculosidade: boolean;
  valeTransporte: boolean; // desconto de até 6% do salário base
  ativo: boolean;
  observacoes: string;
}

// Lançamentos variáveis do mês (informados na apuração da folha).
export interface VariaveisMes {
  horasExtras50: number; // quantidade de horas
  horasExtras100: number;
  horasNoturnas: number;
  faltasEmDias: number;
  outrosProventos: number; // comissões, bônus (R$)
  outrosDescontos: number; // adiantamentos, etc. (R$)
}

export interface ItemFolha {
  rotulo: string;
  valor: number;
  memoria: PassoCalculo[];
}

export interface ResultadoFolha {
  modalidade: Modalidade;
  competencia: string; // "YYYY-MM"
  proventos: ItemFolha[];
  descontos: ItemFolha[];
  encargosEmpregador: ItemFolha[]; // não saem do salário; custo da empresa
  totalProventos: number;
  totalDescontos: number;
  liquido: number;
  totalEncargos: number;
  avisos: string[];
}
