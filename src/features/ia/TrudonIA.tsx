import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Sparkles, Send, X, LogOut, Lock, Loader2 } from 'lucide-react';
import { cx } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { sugestoes, type ContextoIA } from './engine';
import { perguntarIA, type Turno } from './iaClient';
import { useAuth } from './useAuth';

// Renderiza **negrito** simples e quebras de linha.
function Texto({ children }: { children: string }) {
  const linhas = children.split('\n');
  return (
    <>
      {linhas.map((linha, i) => (
        <p key={i} className={linha === '' ? 'h-2' : ''}>
          {linha.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
            parte.startsWith('**') && parte.endsWith('**') ? (
              <strong key={j} className="font-semibold text-graphite-900">
                {parte.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{parte}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

interface Mensagem extends Turno {
  origem?: 'claude' | 'offline';
}

export function TrudonIA({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const { empresas, lancamentos, cobrancas, obrigacoes } = useStore();
  const { session, carregando, entrar, sair } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      autor: 'ia',
      texto:
        'Olá! Sou a **Trudon IA**, sua assistente contábil. Posso responder sobre os **dados do escritório** e tirar **dúvidas de contabilidade e fiscal**. Como posso ajudar?',
    },
  ]);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, aberto, pensando]);

  async function enviar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || pensando) return;
    const ctx: ContextoIA = { empresas, lancamentos, cobrancas, obrigacoes };
    const historico = mensagens.map((m) => ({ autor: m.autor, texto: m.texto }));
    setMensagens((m) => [...m, { autor: 'usuario', texto }]);
    setEntrada('');
    setPensando(true);
    const resposta = await perguntarIA(texto, ctx, historico);
    setMensagens((m) => [
      ...m,
      { autor: 'ia', texto: resposta.texto, origem: resposta.origem },
    ]);
    setPensando(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cx(
          'fixed inset-0 z-40 bg-graphite-950/30 transition-opacity',
          aberto ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onFechar}
      />

      {/* Painel */}
      <div
        className={cx(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-card-hover transition-transform',
          aberto ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Trudon IA"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between bg-graphite-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-graphite-950">
              <Sparkles size={18} />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">Trudon IA</p>
              <p className="text-[11px] text-gold-300">
                {session ? session.user.email : 'Assistente contábil'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {session && (
              <button
                onClick={sair}
                className="rounded-lg p-1.5 text-graphite-300 hover:bg-graphite-800 hover:text-white"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              onClick={onFechar}
              className="rounded-lg p-1 text-graphite-300 hover:bg-graphite-800 hover:text-white"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex flex-1 items-center justify-center text-graphite-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : !session ? (
          <LoginForm onEntrar={entrar} />
        ) : (
          <>
            {/* Conversa */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-graphite-50 p-4">
              {mensagens.map((m, i) => (
                <div
                  key={i}
                  className={cx(
                    'flex',
                    m.autor === 'usuario' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cx(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      m.autor === 'usuario'
                        ? 'bg-graphite-900 text-white'
                        : 'border border-graphite-200 bg-white text-graphite-700',
                    )}
                  >
                    <Texto>{m.texto}</Texto>
                    {m.origem === 'offline' && (
                      <p className="mt-1.5 text-[10px] uppercase tracking-wide text-graphite-400">
                        modo offline
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {pensando && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-graphite-200 bg-white px-4 py-2.5 text-sm text-graphite-500">
                    <Loader2 size={15} className="animate-spin" />
                    Pensando…
                  </div>
                </div>
              )}
              <div ref={fimRef} />
            </div>

            {/* Sugestões */}
            <div className="flex flex-wrap gap-2 border-t border-graphite-200 bg-white px-4 pt-3">
              {sugestoes.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  disabled={pensando}
                  className="rounded-full border border-graphite-200 bg-graphite-50 px-3 py-1 text-xs font-medium text-graphite-600 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-800 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Entrada */}
            <form
              className="flex items-center gap-2 bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(entrada);
              }}
            >
              <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Pergunte algo à Trudon IA…"
                className="input"
                aria-label="Mensagem"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 text-graphite-950 transition-opacity hover:opacity-90 disabled:opacity-40"
                disabled={!entrada.trim() || pensando}
                aria-label="Enviar"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

function LoginForm({
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
    <div className="flex flex-1 flex-col justify-center bg-graphite-50 px-6">
      <div className="mx-auto w-full max-w-xs">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-graphite-900 text-gold-400">
            <Lock size={22} />
          </div>
          <h2 className="font-semibold text-graphite-900">Acesso restrito</h2>
          <p className="mt-1 text-sm text-graphite-500">
            A Trudon IA está disponível apenas para usuários autorizados.
          </p>
        </div>
        <form onSubmit={submeter} className="space-y-3">
          <div>
            <label htmlFor="ia-email" className="label">
              E-mail
            </label>
            <input
              id="ia-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="ia-senha" className="label">
              Senha
            </label>
            <input
              id="ia-senha"
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
    </div>
  );
}
