/// <reference types="vite/client" />

// Variáveis de ambiente do app (prefixo VITE_ para expor ao front-end).
// Opcionais: quando ausentes, `supabase.ts` cai no projeto de nuvem padrão.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
