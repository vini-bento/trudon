// Funções puras do quadro de pessoal.
import { CATEGORIAS_VINCULO, type CategoriaVinculo, type VinculoQuantidade } from './tipos';

// Categorias cuja presença (quantidade > 0) caracteriza folha de pagamento.
const CATEGORIAS_FOLHA = new Set<CategoriaVinculo>(
  CATEGORIAS_VINCULO.filter((c) => c.geraFolha).map((c) => c.categoria),
);

/**
 * Indica se a empresa possui folha de pagamento: verdadeiro quando há pelo
 * menos um vínculo (quantidade > 0) em categoria que gera folha (CLT,
 * pró-labore, estagiário, jovem aprendiz ou doméstico). Autônomo/RPA não conta.
 */
export function possuiFolhaDePagamento(vinculos: VinculoQuantidade[]): boolean {
  return vinculos.some(
    (v) => CATEGORIAS_FOLHA.has(v.categoria) && v.quantidade > 0,
  );
}

/** Total de vínculos no quadro (quantidades negativas são tratadas como 0). */
export function totalVinculos(vinculos: VinculoQuantidade[]): number {
  return vinculos.reduce((soma, v) => soma + Math.max(0, v.quantidade), 0);
}
