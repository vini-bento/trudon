import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { cx } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { sugestoes, type ContextoIA } from './engine';
import { perguntarIA, type Turno } from './iaClient';

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-graphite-950">
              <Sparkles size={18} />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">Trudon IA</p>
              <p className="text-[11px] text-gold-300">Assistente contábil</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-graphite-300 hover:bg-graphite-800 hover:text-white"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-600 text-graphite-950 transition-colors hover:bg-gold-500 disabled:opacity-40"
            disabled={!entrada.trim() || pensando}
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
