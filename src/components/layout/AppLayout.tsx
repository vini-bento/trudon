import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TrudonIA } from '@/features/ia/TrudonIA';

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [iaAberta, setIaAberta] = useState(false);

  return (
    <div className="min-h-screen bg-graphite-50">
      <Sidebar
        aberta={menuAberto}
        onAbrirIA={() => {
          setIaAberta(true);
          setMenuAberto(false);
        }}
      />

      {/* Overlay do menu no mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-20 bg-graphite-950/40 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <div className="lg:pl-64">
        {/* Topbar (mobile) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-graphite-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMenuAberto(true)}
            className="rounded-lg p-2 text-graphite-600 hover:bg-graphite-100"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src="./logo-mark.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold tracking-wide text-graphite-900">
              TRUDON
            </span>
          </div>
          <button
            onClick={() => setIaAberta(true)}
            className="rounded-lg p-2 text-gold-600 hover:bg-gold-50"
            aria-label="Abrir Trudon IA"
          >
            <Sparkles size={22} />
          </button>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <TrudonIA aberto={iaAberta} onFechar={() => setIaAberta(false)} />
    </div>
  );
}
