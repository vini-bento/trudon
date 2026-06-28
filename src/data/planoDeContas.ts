import type { ContaContabil } from './types';

// Plano de contas reduzido e padronizado, compartilhado pelas empresas-cliente.
// Contas não analíticas (grupos) servem apenas para organização hierárquica.
export const planoDeContas: ContaContabil[] = [
  // ATIVO
  { id: 'g-ativo', codigo: '1', nome: 'Ativo', tipo: 'Ativo', natureza: 'Devedora', analitica: false },
  { id: 'caixa', codigo: '1.1.01.001', nome: 'Caixa', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'banco', codigo: '1.1.01.002', nome: 'Bancos Conta Movimento', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'clientes', codigo: '1.1.02.001', nome: 'Clientes a Receber', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'estoque', codigo: '1.1.03.001', nome: 'Estoques', tipo: 'Ativo', natureza: 'Devedora', analitica: true },
  { id: 'imobilizado', codigo: '1.2.01.001', nome: 'Imobilizado', tipo: 'Ativo', natureza: 'Devedora', analitica: true },

  // PASSIVO
  { id: 'g-passivo', codigo: '2', nome: 'Passivo', tipo: 'Passivo', natureza: 'Credora', analitica: false },
  { id: 'fornecedores', codigo: '2.1.01.001', nome: 'Fornecedores', tipo: 'Passivo', natureza: 'Credora', analitica: true },
  { id: 'salarios-pagar', codigo: '2.1.02.001', nome: 'Salários a Pagar', tipo: 'Passivo', natureza: 'Credora', analitica: true },
  { id: 'impostos-pagar', codigo: '2.1.03.001', nome: 'Impostos a Recolher', tipo: 'Passivo', natureza: 'Credora', analitica: true },
  { id: 'emprestimos', codigo: '2.2.01.001', nome: 'Empréstimos Bancários', tipo: 'Passivo', natureza: 'Credora', analitica: true },

  // PATRIMÔNIO LÍQUIDO
  { id: 'g-pl', codigo: '2.3', nome: 'Patrimônio Líquido', tipo: 'Patrimônio Líquido', natureza: 'Credora', analitica: false },
  { id: 'capital', codigo: '2.3.01.001', nome: 'Capital Social', tipo: 'Patrimônio Líquido', natureza: 'Credora', analitica: true },

  // RECEITAS
  { id: 'g-receita', codigo: '3', nome: 'Receitas', tipo: 'Receita', natureza: 'Credora', analitica: false },
  { id: 'receita-servicos', codigo: '3.1.01.001', nome: 'Receita de Serviços', tipo: 'Receita', natureza: 'Credora', analitica: true },
  { id: 'receita-vendas', codigo: '3.1.02.001', nome: 'Receita de Vendas', tipo: 'Receita', natureza: 'Credora', analitica: true },

  // DESPESAS
  { id: 'g-despesa', codigo: '4', nome: 'Despesas', tipo: 'Despesa', natureza: 'Devedora', analitica: false },
  { id: 'desp-salarios', codigo: '4.1.01.001', nome: 'Despesa com Salários', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
  { id: 'desp-impostos', codigo: '4.1.02.001', nome: 'Despesa com Impostos', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
  { id: 'desp-aluguel', codigo: '4.1.03.001', nome: 'Despesa com Aluguel', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
  { id: 'desp-fornecedores', codigo: '4.1.04.001', nome: 'Custo de Mercadorias/Serviços', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
  { id: 'desp-gerais', codigo: '4.1.05.001', nome: 'Despesas Administrativas', tipo: 'Despesa', natureza: 'Devedora', analitica: true },
];
