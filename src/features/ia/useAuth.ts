// Hook de autenticação da Trudon IA (Supabase Auth).
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { iniciais, nomeDoEmail } from '@/lib/format';

// Perfil do usuário logado (tabela public.perfis).
export interface Perfil {
  nome: string | null;
  dono: boolean;
  papel: 'equipe' | 'cliente';
  permissoes: string[];
  empresaId: string | null;
}

// Identidade exibível do usuário logado (nome real, e-mail, iniciais).
export interface UsuarioLogado {
  nome: string;
  email: string;
  iniciais: string;
  dono: boolean;
  papel: 'equipe' | 'cliente';
  permissoes: string[];
  empresaId: string | null;
}

export interface EstadoAuth {
  session: Session | null;
  perfil: Perfil | null;
  usuario: UsuarioLogado | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>;
  sair: () => Promise<void>;
}

export function useAuth(): EstadoAuth {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
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

  // Carrega o perfil real do usuário logado (nome, papel, permissões).
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setPerfil(null);
      return;
    }
    let ativo = true;
    supabase
      .from('perfis')
      .select('nome, dono, papel, permissoes, empresa_id')
      .eq('id', uid)
      .single()
      .then(({ data }) => {
        if (!ativo || !data) return;
        setPerfil({
          nome: data.nome ?? null,
          dono: data.dono ?? false,
          papel: (data.papel as Perfil['papel']) ?? 'equipe',
          permissoes: data.permissoes ?? [],
          empresaId: data.empresa_id ?? null,
        });
      });
    return () => {
      ativo = false;
    };
  }, [session?.user?.id]);

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

  // Identidade exibível: usa o nome do perfil; se vier vazio ou for o próprio
  // e-mail (padrão quando o perfil não tem nome), deriva um nome do e-mail.
  let usuario: UsuarioLogado | null = null;
  if (session?.user) {
    const email = session.user.email ?? '';
    const nomePerfil =
      perfil?.nome && !perfil.nome.includes('@') ? perfil.nome : '';
    const nome = nomePerfil || nomeDoEmail(email) || email;
    usuario = {
      nome,
      email,
      iniciais: iniciais(nome),
      dono: perfil?.dono ?? false,
      papel: perfil?.papel ?? 'equipe',
      permissoes: perfil?.permissoes ?? [],
      empresaId: perfil?.empresaId ?? null,
    };
  }

  return { session, perfil, usuario, carregando, entrar, sair };
}
