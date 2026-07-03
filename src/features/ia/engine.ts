// Motor da Trudon IA (fase 1: baseado em regras sobre os dados reais do app).
//
// PONTO DE INTEGRAÇÃO: nesta fase, as respostas são geradas localmente a partir
// dos dados do escritório — sem enviar nada para fora, o que é ideal para dados
// sensíveis. Na fase de produção, `responder()` pode ser trocada por uma chamada
// à API da Claude (Anthropic), mantendo a mesma assinatura e a mesma camada de
// contexto montada aqui. Nenhuma chave de API vive no código do cliente.
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type {
  Cobranca,
  Empresa,
  Lancamento,
  Obrigacao,
} from '@/data/types';
import { planoDeContas } from '@/data/planoDeContas';
import { gerarDRE } from '@/lib/accounting';
import { resumoHonorarios } from '@/lib/finance';
import { formatBRL, formatPercent } from '@/lib/format';
import { buscarConhecimento } from './knowledge';

export interface ContextoIA {
  empresas: Empresa[];
  lancamentos: Lancamento[];
  cobrancas: Cobranca[];
  obrigacoes: Obrigacao[];
}

export interface RespostaIA {
  texto: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function obrigacoesAtrasadas(ctx: ContextoIA): Obrigacao[] {
  return ctx.obrigacoes.filter((o) => o.status === 'Atrasada');
}

function nomeEmpresa(ctx: ContextoIA, id: string): string {
  return ctx.empresas.find((e) => e.id === id)?.nomeFantasia ?? 'empresa';
}

/** Gera a resposta da Trudon IA para uma pergunta livre. */
export function responder(pergunta: string, ctx: ContextoIA): RespostaIA {
  const q = norm(pergunta);

  // Perguntas claramente conceituais vão direto para a base de conhecimento,
  // evitando que palavras soltas (ex.: "das" em "dobradas") caiam num ramo de dados.
  if (/(o que e|o que sao|como funciona|qual a diferenca|diferenca entre|explica|significa|defina|conceito de)/.test(q)) {
    const c = buscarConhecimento(q);
    if (c) return { texto: `${c.resposta}${ressalvaFiscal(c.id)}` };
  }

  // Clientes / empresas
  if (/(quant|numero|total).*(client|empresa)|client.*ativ|empresa.*ativ/.test(q)) {
    const ativas = ctx.empresas.filter((e) => e.situacao === 'Ativa').length;
    const suspensas = ctx.empresas.filter((e) => e.situacao === 'Suspensa').length;
    return {
      texto: `O escritório tem **${ctx.empresas.length} empresas** na carteira: ${ativas} ativas${
        suspensas ? `, ${suspensas} suspensas` : ''
      }. Posso detalhar por regime tributário ou por responsável, se quiser.`,
    };
  }

  // Inadimplência / honorários a receber
  if (/(inadimpl|atrasad|receber|honorario|cobranc|faturamento)/.test(q)) {
    const resumo = resumoHonorarios(ctx.cobrancas);
    return {
      texto: `Considerando todas as competências em aberto:\n\n• **A receber (pendente):** ${formatBRL(
        resumo.pendente,
      )}\n• **Em atraso:** ${formatBRL(resumo.atrasado)}\n• **Já recebido:** ${formatBRL(
        resumo.recebido,
      )}\n\nA taxa de inadimplência está em **${formatPercent(
        resumo.taxaInadimplencia,
      )}**. Vá em Honorários para registrar baixas.`,
    };
  }

  // Obrigações / prazos
  if (/(obrigac|prazo|vencer|vencendo|entrega|\bdas\b|dctf|esocial|fgts|imposto)/.test(q)) {
    const atrasadas = obrigacoesAtrasadas(ctx);
    const proximas = ctx.obrigacoes
      .filter((o) => o.status !== 'Concluída' && o.status !== 'Atrasada')
      .map((o) => ({ o, dias: differenceInCalendarDays(parseISO(o.vencimento), new Date()) }))
      .filter((x) => x.dias >= 0 && x.dias <= 7)
      .sort((a, b) => a.dias - b.dias);

    let txt = '';
    if (atrasadas.length) {
      txt += `⚠️ Há **${atrasadas.length} obrigação(ões) em atraso**. Prioridade máxima.\n\n`;
    }
    if (proximas.length) {
      txt += `Vencem nos próximos 7 dias:\n`;
      txt += proximas
        .slice(0, 5)
        .map((x) => `• ${x.o.titulo} — ${nomeEmpresa(ctx, x.o.empresaId)} (${x.dias === 0 ? 'hoje' : `em ${x.dias}d`})`)
        .join('\n');
    }
    if (!txt) txt = 'Nenhuma obrigação atrasada ou vencendo nos próximos 7 dias. Tudo em dia! 👏';
    return { texto: txt };
  }

  // Resultado / DRE / lucro
  if (/(resultado|lucro|prejuizo|dre|margem|receita|despesa)/.test(q)) {
    const dre = gerarDRE(planoDeContas, ctx.lancamentos);
    const tipo = dre.resultado >= 0 ? 'lucro' : 'prejuízo';
    return {
      texto: `Consolidando os lançamentos da carteira no mês:\n\n• **Receitas:** ${formatBRL(
        dre.receitaBruta,
      )}\n• **Despesas:** ${formatBRL(dre.despesasTotais)}\n• **Resultado:** ${formatBRL(
        dre.resultado,
      )} (${tipo}), margem de ${formatPercent(dre.margem)}.\n\nEm Contabilidade você vê o balancete e a DRE por empresa.`,
    };
  }

  // Ajuda / capacidades
  if (/(ajuda|pode fazer|consegue|o que voce|quem e voce|ola|oi|bom dia|boa tarde)/.test(q)) {
    return {
      texto:
        'Sou a **Trudon IA**, sua assistente contábil. Posso ajudar em duas frentes:\n\n**Sobre o seu escritório** (dados reais):\n• Carteira de clientes e regimes\n• Honorários e inadimplência\n• Obrigações e prazos\n• Resultado (DRE)\n\n**Dúvidas de contabilidade e fiscal**:\n• Regimes (Simples, Presumido, Real, MEI)\n• Obrigações (DAS, DCTFWeb, eSocial, FGTS, SPED)\n• Impostos (PIS/COFINS, ICMS, ISS)\n• Conceitos (partidas dobradas, DRE, competência, depreciação, 13º/férias)\n\nÉ só perguntar em linguagem natural.',
    };
  }

  // Conhecimento contábil/fiscal (base local)
  const conhecimento = buscarConhecimento(q);
  if (conhecimento) {
    return { texto: `${conhecimento.resposta}${ressalvaFiscal(conhecimento.id)}` };
  }

  // Fallback
  return {
    texto:
      'Ainda não tenho uma resposta precisa para isso nesta versão offline. Posso ajudar com **seus dados** (clientes, honorários, obrigações, resultado) e com **conceitos de contabilidade e fiscal** (regimes, DAS/DCTF/eSocial, impostos, lançamentos). Tente reformular ou escolha uma sugestão abaixo.\n\n_Em breve, com a conexão à Claude, poderei responder perguntas abertas com muito mais profundidade._',
  };
}

// Acrescenta uma ressalva profissional nos temas com valores/prazos sujeitos a lei.
function ressalvaFiscal(id: string): string {
  const sensiveis = new Set([
    'simples', 'presumido', 'real', 'mei', 'das', 'dctfweb',
    'esocial', 'fgts', 'sped', 'pis-cofins', 'icms-iss', '13-ferias',
  ]);
  return sensiveis.has(id)
    ? '\n\n_⚠️ Valores e prazos seguem regras gerais e podem mudar — confirme sempre a legislação vigente._'
    : '';
}

/** Sugestões de perguntas exibidas no painel. */
export const sugestoes = [
  'Quantos clientes ativos temos?',
  'Qual a inadimplência atual?',
  'Quais obrigações estão atrasadas?',
  'O que é o Simples Nacional?',
  'Qual a diferença entre ICMS e ISS?',
  'Como funcionam as partidas dobradas?',
];

// Severidade do insight — governa a hierarquia visual no dashboard:
// crítico = ação imediata (cor funcional), atenção = revisar (ênfase de peso),
// neutro = informativo.
export type SeveridadeInsight = 'critico' | 'atencao' | 'neutro';

export interface Insight {
  texto: string;
  severidade: SeveridadeInsight;
}

/** Insights proativos para o dashboard, ordenados do mais grave ao neutro. */
export function gerarInsights(ctx: ContextoIA): Insight[] {
  const insights: Insight[] = [];
  const atrasadas = obrigacoesAtrasadas(ctx);
  if (atrasadas.length) {
    insights.push({
      texto: `${atrasadas.length} obrigação(ões) em atraso exigem atenção imediata.`,
      severidade: 'critico',
    });
  }
  const resumo = resumoHonorarios(ctx.cobrancas);
  if (resumo.taxaInadimplencia > 5) {
    insights.push({
      texto: `Inadimplência em ${formatPercent(resumo.taxaInadimplencia)} — acima do ideal (5%). ${formatBRL(
        resumo.atrasado,
      )} em atraso.`,
      severidade: 'atencao',
    });
  }
  const suspensas = ctx.empresas.filter((e) => e.situacao === 'Suspensa');
  if (suspensas.length) {
    insights.push({
      texto: `${suspensas.length} empresa(s) com situação suspensa — vale revisar o cadastro.`,
      severidade: 'atencao',
    });
  }
  if (!insights.length) {
    insights.push({
      texto: 'Carteira saudável: sem atrasos críticos e inadimplência sob controle.',
      severidade: 'neutro',
    });
  }
  return insights;
}
