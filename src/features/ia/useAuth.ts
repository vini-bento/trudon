// Hook de autenticação da Trudon IA (Supabase Auth).
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface EstadoAuth {
  session: Session | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>;
  sair: () => Promise<void>;
}

export function useAuth(): EstadoAuth {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function entrar(email: string, senha: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (!error) return null;
    // Mensagens amigáveis para os erros mais comuns.
    if (/invalid login credentials/i.test(error.message)) {
      return 'E-mail ou senha incorretos.';
    }
    if (/email not confirmed/i.test(error.message)) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }
    return error.message;
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return { session, carregando, entrar, sair };
}
