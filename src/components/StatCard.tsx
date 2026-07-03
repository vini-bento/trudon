import type { ReactNode } from 'react';
import { cx } from './ui';

// Cartão de indicador para o dashboard.
// Linguagem visual (skill design-trudon-erp): quase monocromático — o ícone é
// um glifo discreto em grafite, sem chip colorido decorativo; a cor só aparece
// no valor quando é FUNCIONAL (estado crítico). Cifras em tabular-nums.
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
  // Só o estado crítico (red) tinge o número; o resto é grafite. Acento gold e
  // demais cores ficam reservados para onde comunicam algo, não para enfeitar.
  const corValor = tom === 'red' ? 'text-red-600' : 'text-graphite-900';
  return (
    <div className="card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-graphite-500">
          {titulo}
        </p>
        <span className="shrink-0 text-graphite-400">{icone}</span>
      </div>
      <p
        className={cx(
          'mt-3 text-2xl font-semibold tracking-tight tabular-nums',
          corValor,
        )}
      >
        {valor}
      </p>
      {detalhe && <div className="mt-2 text-sm tabular-nums">{detalhe}</div>}
    </div>
  );
}
