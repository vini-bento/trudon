import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/ia/useAuth';
import { useStore } from '@/store/useStore';
import { listarEmpresas } from '@/lib/empresasApi';
import { listarContratos, listarCobrancas } from '@/lib/honorariosApi';
import { listarObrigacoes } from '@/lib/obrigacoesApi';

// Porta de entrada do app: exige login para todos. Enquanto não houver sessão,
// mostra a tela de login da Trudon. Com sessão, hidrata as empresas do banco
// (se disponível) e libera o app.
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, carregando, entrar } = useAuth();
  const definirEmpresas = useStore((s) => s.definirEmpresas);
  const definirContratos = useStore((s) => s.definirContratos);
  const definirCobrancas = useStore((s) => s.definirCobrancas);
  const definirObrigacoes = useStore((s) => s.definirObrigacoes);

  useEffect(() => {
    if (!session) return;
    let ativo = true;
    // Hidrata cada conjunto a partir do banco; se algum falhar (banco ainda não
    // configurado / indisponível), mantém os dados locais daquele conjunto.
    const hidratar = <T,>(
      buscar: () => Promise<T[]>,
      definir: (l: T[]) => void,
    ) => {
      buscar()
        .then((lista) => {
          if (ativo && lista.length) definir(lista);
        })
        .catch(() => {});
    };
    hidratar(listarEmpresas, definirEmpresas);
    hidratar(listarContratos, definirContratos);
    hidratar(listarCobrancas, definirCobrancas);
    hidratar(listarObrigacoes, definirObrigacoes);
    return () => {
      ativo = false;
    };
  }, [
    session,
    definirEmpresas,
    definirContratos,
    definirCobrancas,
    definirObrigacoes,
  ]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-950 text-gold-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!session) return <TelaLogin onEntrar={entrar} />;

  return <>{children}</>;
}

function TelaLogin({
  onEntrar,
}: {
  onEntrar: (email: string, senha: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const msg = await onEntrar(email, senha);
    if (msg) setErro(msg);
    setEnviando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-graphite-950 to-graphite-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="./logo-mark.png"
            alt="Trudon"
            className="h-16 w-16 object-contain"
          />
          <p className="mt-3 font-display text-2xl font-bold tracking-wide text-white">
            TRUDON
          </p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">
            Inteligência Contábil
          </p>
        </div>

        <div className="rounded-2xl border border-graphite-800 bg-graphite-900/80 p-6 shadow-card-hover backdrop-blur">
          <h1 className="mb-1 text-lg font-semibold text-white">Entrar</h1>
          <p className="mb-5 text-sm text-graphite-400">
            Acesse com suas credenciais.
          </p>
          <form onSubmit={submeter} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-graphite-400"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 px-3 py-2 text-sm text-white placeholder:text-graphite-500 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30"
              />
            </div>
            <div>
              <label
                htmlFor="senha"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-graphite-400"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-graphite-700 bg-graphite-950 px-3 py-2 text-sm text-white placeholder:text-graphite-500 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30"
              />
            </div>
            {erro && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {erro}
              </p>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 px-4 py-2.5 text-sm font-semibold text-graphite-950 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />}
              Entrar
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-graphite-500">
          Acesso exclusivo para a equipe e clientes autorizados da Trudon.
        </p>
      </div>
    </div>
  );
}
