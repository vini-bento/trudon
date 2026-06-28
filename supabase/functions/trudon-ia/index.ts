// Edge Function: Trudon IA — conversa com a Claude (Anthropic) no lado servidor.
//
// Segurança:
//  - Só responde a usuários AUTENTICADOS (verifica o token via Supabase Auth).
//    A chave anon sozinha não basta — exigimos um usuário real (você/Kelly/+).
//  - A ANTHROPIC_API_KEY vive apenas nos Secrets do Supabase, nunca no navegador.
//
// Deploy:
//   supabase functions deploy trudon-ia
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Variáveis de ambiente (SUPABASE_URL e SUPABASE_ANON_KEY são injetadas
// automaticamente pelo runtime do Supabase).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODELO = Deno.env.get('TRUDON_IA_MODEL') ?? 'claude-sonnet-4-6';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT = (contexto: string) =>
  `Você é a **Trudon IA**, assistente contábil do escritório Trudon — Inteligência Contábil.
Responde em português do Brasil, de forma clara, objetiva e profissional.

Você ajuda em duas frentes:
1. Dados do escritório (use o CONTEXTO abaixo, que reflete o sistema agora).
2. Dúvidas de contabilidade e fiscal brasileiras (regimes tributários, obrigações
   acessórias, impostos, conceitos contábeis, rotinas trabalhistas).

Regras:
- Seja preciso. Quando envolver valores, alíquotas ou prazos sujeitos à legislação,
  acrescente uma ressalva curta para conferir a norma vigente.
- Não invente números do escritório que não estejam no CONTEXTO; se não souber, diga.
- Use **negrito** para destacar pontos importantes. Seja conciso.

CONTEXTO DO ESCRITÓRIO (no momento):
${contexto}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1) Exige usuário autenticado
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Não autorizado' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return json({ error: 'Não autorizado' }, 401);
  }

  // 2) Chave da Anthropic (segredo do servidor)
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'IA não configurada (sem chave).' }, 500);

  // 3) Monta a conversa
  let corpo: { pergunta?: string; contexto?: string; historico?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  const pergunta = (corpo.pergunta ?? '').toString().trim();
  if (!pergunta) return json({ error: 'Pergunta vazia' }, 400);

  const historico = Array.isArray(corpo.historico) ? corpo.historico : [];
  const messages = [
    ...historico
      .filter(
        (m): m is { role: string; content: string } =>
          !!m && typeof (m as { content?: unknown }).content === 'string',
      )
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    { role: 'user', content: pergunta },
  ];

  // 4) Chama a Claude
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1024,
        system: SYSTEM_PROMPT((corpo.contexto ?? '').toString()),
        messages,
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error('Anthropic error', resp.status, detalhe);
      return json({ error: 'Falha ao consultar a IA.' }, 502);
    }

    const data = await resp.json();
    const texto =
      (data?.content ?? [])
        .filter((b: { type?: string }) => b.type === 'text')
        .map((b: { text?: string }) => b.text ?? '')
        .join('\n')
        .trim() || 'Não consegui gerar uma resposta agora.';

    return json({ texto });
  } catch (e) {
    console.error('Erro inesperado', e);
    return json({ error: 'Erro interno.' }, 500);
  }
});
