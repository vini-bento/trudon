// Acesso à tabela `quadro_pessoal` no Supabase (contagem de vínculos por
// categoria de cada empresa). Mapeia snake_case ↔ camelCase.
import { supabase } from './supabase';
import type { CategoriaVinculo, ItemQuadroPessoal } from './pessoal';

type Row = {
  id: string;
  empresa_id: string;
  categoria: CategoriaVinculo;
  quantidade: number | string;
};

const paraItem = (r: Row): ItemQuadroPessoal => ({
  id: r.id,
  empresaId: r.empresa_id,
  categoria: r.categoria,
  quantidade: Number(r.quantidade),
});

/** Quadro de pessoal de uma empresa (uma linha por categoria presente). */
export async function listarQuadroPessoal(
  empresaId: string,
): Promise<ItemQuadroPessoal[]> {
  const { data, error } = await supabase
    .from('quadro_pessoal')
    .select('*')
    .eq('empresa_id', empresaId);
  if (error) throw error;
  return (data as Row[]).map(paraItem);
}

/**
 * Substitui o quadro de pessoal da empresa pelas quantidades informadas.
 * Só persiste categorias com quantidade > 0; as demais são removidas (mantém a
 * tabela enxuta e o "possui folha" derivável sem linhas zeradas). O id é
 * determinístico (`qp-<empresa>-<categoria>`) para permitir upsert idempotente.
 */
export async function salvarQuadroPessoal(
  empresaId: string,
  quantidades: Record<CategoriaVinculo, number>,
): Promise<void> {
  const linhas = (Object.entries(quantidades) as [CategoriaVinculo, number][])
    .filter(([, q]) => q > 0)
    .map(([categoria, quantidade]) => ({
      id: `qp-${empresaId}-${categoria}`,
      empresa_id: empresaId,
      categoria,
      quantidade,
    }));

  // Remove categorias que zeraram (não vieram no conjunto a inserir).
  const manter = linhas.map((l) => l.categoria);
  let del = supabase.from('quadro_pessoal').delete().eq('empresa_id', empresaId);
  if (manter.length) del = del.not('categoria', 'in', `(${manter.join(',')})`);
  const { error: erroDel } = await del;
  if (erroDel) throw erroDel;

  if (linhas.length) {
    const { error } = await supabase
      .from('quadro_pessoal')
      .upsert(linhas, { onConflict: 'empresa_id,categoria' });
    if (error) throw error;
  }
}
