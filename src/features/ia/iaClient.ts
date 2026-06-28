// Cliente da Trudon IA: conversa com a Edge Function (Claude) quando o usuário
// está autenticado; se a função falhar ou não estiver disponível, cai no motor
// offline baseado em regras (knowledge.ts/engine.ts) para nunca quebrar.
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { TRUDON_IA_ENDPOINT, supabase } from '@/lib/supabase';
import { responder, type ContextoIA } from './engine';
import { gerarDRE } from '@/lib/accounting';
import { resumoHonorarios } from '@/lib/finance';
import { planoDeContas } from '@/data/planoDeContas';
import { formatBRL, formatPercent } from '@/lib/format';

export interface Turno {
  autor: 'ia' | 'usuario';
  texto: string;
}

export interface RespostaTrudonIA {
  texto: string;
  origem: 'claude' | 'offline';
}

/** Monta um resumo compacto e factual do escritório para dar contexto à IA. */
export function montarContexto(ctx: ContextoIA): string {
  const ativas = ctx.empresas.filter((e) => e.situacao === 'Ativa').length;
  const suspensas = ctx.empresas.filter((e) => e.situacao === 'Suspensa').length;
  const resumo = resumoHonorarios(ctx.cobrancas);
  const dre = gerarDRE(planoDeContas, ctx.lancamentos);
  const atrasadas = ctx.obrigacoes.filter((o) => o.status === 'Atrasada');
  const proximas = ctx.obrigacoes
    .filter((o) => o.status !== 'Concluída')
    .map((o) => ({ o, dias: differenceInCalendarDays(parseISO(o.vencimento), new Date()) }))
    .filter((x) => x.dias >= 0 && x.dias <= 7)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 8);
  const nome = (id: string) =>
    ctx.empresas.find((e) => e.id === id)?.nomeFantasia ?? 'empresa';

  const linhas = [
    `Carteira: ${ctx.empresas.length} empresas (${ativas} ativas, ${suspensas} suspensas).`,
    `Honorários — recebido ${formatBRL(resumo.recebido)}, a receber ${formatBRL(
      resumo.pendente,
    )}, em atraso ${formatBRL(resumo.atrasado)} (inadimplência ${formatPercent(
      resumo.taxaInadimplencia,
    )}).`,
    `Resultado do mês (consolidado): receitas ${formatBRL(
      dre.receitaBruta,
    )}, despesas ${formatBRL(dre.despesasTotais)}, resultado ${formatBRL(
      dre.resultado,
    )} (margem ${formatPercent(dre.margem)}).`,
    `Obrigações em atraso: ${atrasadas.length}.`,
  ];
  if (proximas.length) {
    linhas.push(
      'Vencendo em até 7 dias: ' +
        proximas
          .map((x) => `${x.o.titulo}/${nome(x.o.empresaId)} (${x.dias}d)`)
          .join('; ') +
        '.',
    );
  }
  return linhas.join('\n');
}

/**
 * Pergunta à Trudon IA. Usa a Claude via Edge Function (autenticada); em caso de
 * erro de rede, função não publicada ou ausência de sessão, usa o motor offline.
 */
export async function perguntarIA(
  pergunta: string,
  ctx: ContextoIA,
  historico: Turno[],
): Promise<RespostaTrudonIA> {
  const offline = (): RespostaTrudonIA => ({
    texto: responder(pergunta, ctx).texto,
    origem: 'offline',
  });

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return offline();

  try {
    const resp = await fetch(TRUDON_IA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pergunta,
        contexto: montarContexto(ctx),
        historico: historico.slice(-8).map((t) => ({
          role: t.autor === 'usuario' ? 'user' : 'assistant',
          content: t.texto,
        })),
      }),
    });
    if (!resp.ok) return offline();
    const json = (await resp.json()) as { texto?: string };
    if (!json.texto) return offline();
    return { texto: json.texto, origem: 'claude' };
  } catch {
    return offline();
  }
}
