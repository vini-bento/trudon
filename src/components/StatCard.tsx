import type { ReactNode } from 'react';
import { cx } from './ui';

// Cartão de indicador para o dashboard.
export function StatCard({
  titulo,
  valor,
  icone,
  detalhe,
  tom = 'graphite',
}: {
  titulo: string;
  valor: string;
  icone: ReactNode;
  detalhe?: ReactNode;
  tom?: 'graphite' | 'gold' | 'green' | 'red' | 'blue';
}) {
  const tons: Record<string, string> = {
    graphite: 'bg-graphite-900 text-gold-300',
    gold: 'bg-gold-100 text-gold-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-700',
  };
  return (
    <div className="card p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-graphite-500">
          {titulo}
        </p>
        <div
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            tons[tom],
          )}
        >
          {icone}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-graphite-900">
        {valor}
      </p>
      {detalhe && <div className="mt-2 text-sm">{detalhe}</div>}
    </div>
  );
}
