// Cliente Supabase do Trudon ERP.
//
// A URL e a chave "anon" são PÚBLICAS por design — elas são feitas para viver
// no código do front-end. A segurança vem do login (Supabase Auth, com cadastro
// público desligado) e das políticas de acesso (RLS), nunca de esconder a anon.
// A `service_role` e a chave da Anthropic NUNCA entram aqui — ficam no servidor.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://eyttthsbuqapjklagnlr.supabase.co';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dHR0aHNidXFhcGprbGFnbmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTkyOTksImV4cCI6MjA5ODE3NTI5OX0.ybZOG-mnzT22wRjwYrIg3bHpLIH2G8F0lbZCWF7UvX0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Endpoint da Edge Function que conversa com a Claude (lado servidor).
export const TRUDON_IA_ENDPOINT = `${SUPABASE_URL}/functions/v1/trudon-ia`;
