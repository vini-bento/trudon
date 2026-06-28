import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BookOpenCheck,
  Calculator,
  Receipt,
  CalendarClock,
  FolderLock,
  Sparkles,
  Settings,
  LogOut,
} from 'lucide-react';
import { cx } from '../ui';
import { USUARIO_LOGADO } from '@/data/seed';
import { useAuth } from '@/features/ia/useAuth';

const itens = [
  { para: '/', rotulo: 'Dashboard', icone: LayoutDashboard, fim: true },
  { para: '/empresas', rotulo: 'Empresas', icone: Building2 },
  { para: '/contabilidade', rotulo: 'Contabilidade', icone: BookOpenCheck },
  { para: '/fiscal', rotulo: 'Fiscal', icone: Calculator },
  { para: '/honorarios', rotulo: 'Honorários', icone: Receipt },
  { para: '/obrigacoes', rotulo: 'Obrigações', icone: CalendarClock },
  { para: '/portal', rotulo: 'Portal do Cliente', icone: FolderLock },
  { para: '/config', rotulo: 'Configurações', icone: Settings },
];

export function Sidebar({
  aberta,
  onAbrirIA,
}: {
  aberta: boolean;
  onAbrirIA: () => void;
}) {
  const { session, sair } = useAuth();
  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-graphite-950 text-graphite-200 transition-transform lg:translate-x-0',
        aberta ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src="./logo-mark.png"
          alt="Trudon"
          className="h-10 w-10 object-contain"
        />
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-wide text-white">
            TRUDON
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">
            Inteligência Contábil
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {itens.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-graphite-800 text-white shadow-[inset_3px_0_0] shadow-gold-400'
                  : 'text-graphite-400 hover:bg-graphite-900 hover:text-graphite-100',
              )
            }
          >
            <Icone size={18} />
            {rotulo}
          </NavLink>
        ))}
      </nav>

      {/* Trudon IA */}
      <div className="px-3 pb-2">
        <button
          onClick={onAbrirIA}
          className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 px-3 py-2.5 text-sm font-semibold text-graphite-950 transition-opacity hover:opacity-90"
        >
          <Sparkles size={18} />
          Trudon IA
        </button>
      </div>

      {/* Usuário */}
      <div className="flex items-center gap-3 border-t border-graphite-800 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-graphite-950">
          {USUARIO_LOGADO.iniciais}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-white">
            {USUARIO_LOGADO.nome}
          </p>
          <p className="truncate text-xs text-graphite-400">
            {session?.user.email ?? USUARIO_LOGADO.cargo}
          </p>
        </div>
        <button
          onClick={sair}
          className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-800 hover:text-white"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
