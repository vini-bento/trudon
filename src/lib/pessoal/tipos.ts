// Tipos do Quadro de Pessoal — contagem de vínculos por categoria, por empresa.
//
// Este é um cadastro AGREGADO (quantos vínculos de cada tipo a empresa tem),
// distinto do cadastro individual de funcionários do módulo de Folha
// (`src/lib/folha/`). Ele existe para responder cedo, sem cadastrar cada
// pessoa, uma pergunta que o motor de Obrigações precisa: "esta empresa tem
// folha de pagamento?". A evolução para cadastro individual (ROADMAP, Nível 2)
// reaproveita estas categorias.

// Categorias de vínculo reconhecidas pelo quadro de pessoal. A chave é estável
// (usada no banco); o rótulo é a exibição.
export type CategoriaVinculo =
  | 'clt'
  | 'pro_labore'
  | 'estagiario'
  | 'jovem_aprendiz'
  | 'autonomo_rpa'
  | 'domestico';

export interface CategoriaVinculoInfo {
  categoria: CategoriaVinculo;
  rotulo: string;
  // Se este tipo de vínculo, quando presente, caracteriza folha de pagamento
  // (gera eSocial/FGTS Digital/DIRF etc.). Autônomo/RPA é contribuinte
  // individual: recolhe por RPA, não integra folha.
  geraFolha: boolean;
}

// Ordem de exibição no formulário. Fonte única da verdade sobre quais
// categorias existem e quais caracterizam folha.
export const CATEGORIAS_VINCULO: CategoriaVinculoInfo[] = [
  { categoria: 'clt', rotulo: 'Empregado CLT', geraFolha: true },
  { categoria: 'pro_labore', rotulo: 'Sócio com pró-labore', geraFolha: true },
  { categoria: 'estagiario', rotulo: 'Estagiário', geraFolha: true },
  { categoria: 'jovem_aprendiz', rotulo: 'Jovem aprendiz', geraFolha: true },
  {
    categoria: 'autonomo_rpa',
    rotulo: 'Autônomo / contribuinte individual (RPA)',
    geraFolha: false,
  },
  { categoria: 'domestico', rotulo: 'Empregado doméstico', geraFolha: true },
];

// Par categoria→quantidade, unidade mínima manipulada pelas funções puras.
export interface VinculoQuantidade {
  categoria: CategoriaVinculo;
  quantidade: number;
}

// Registro persistido (uma linha por empresa+categoria na tabela quadro_pessoal).
export interface ItemQuadroPessoal extends VinculoQuantidade {
  id: string;
  empresaId: string;
}
