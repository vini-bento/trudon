import { createHashRouter, RouterProvider, Link, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Empresas } from '@/pages/Empresas';
import { Contabilidade } from '@/pages/Contabilidade';
import { Fiscal } from '@/pages/Fiscal';
import { Folha } from '@/pages/Folha';
import { Honorarios } from '@/pages/Honorarios';
import { Obrigacoes } from '@/pages/Obrigacoes';
import { Portal } from '@/pages/Portal';
import { Configuracoes } from '@/pages/Configuracoes';
import { useAuth } from '@/features/ia/useAuth';
import { podeAcessar, areaInicial, type Area } from '@/features/auth/permissoes';

// Guarda de rota: só renderiza a página se o usuário pode acessar a área.
// Caso contrário, redireciona para a área inicial do papel (falha segura).
function ExigeAcesso({ area, children }: { area: Area; children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  if (!podeAcessar(area, usuario)) {
    const destino = areaInicial(usuario);
    return <Navigate to={destino === 'portal' ? '/portal' : '/'} replace />;
  }
  return <>{children}</>;
}

function NaoEncontrado() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-gold-500">404</p>
      <p className="mt-2 text-graphite-600">Página não encontrada.</p>
      <Link
        to="/"
        className="mt-4 rounded-lg bg-graphite-900 px-4 py-2 text-sm font-semibold text-white hover:bg-graphite-800"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}

// HashRouter: funciona em qualquer host estático (GitHub Pages incluso)
// sem necessidade de configuração de rewrite no servidor.
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ExigeAcesso area="dashboard"><Dashboard /></ExigeAcesso> },
      { path: 'empresas', element: <ExigeAcesso area="empresas"><Empresas /></ExigeAcesso> },
      { path: 'contabilidade', element: <ExigeAcesso area="contabilidade"><Contabilidade /></ExigeAcesso> },
      { path: 'fiscal', element: <ExigeAcesso area="fiscal"><Fiscal /></ExigeAcesso> },
      { path: 'folha', element: <ExigeAcesso area="folha"><Folha /></ExigeAcesso> },
      { path: 'honorarios', element: <ExigeAcesso area="honorarios"><Honorarios /></ExigeAcesso> },
      { path: 'obrigacoes', element: <ExigeAcesso area="obrigacoes"><Obrigacoes /></ExigeAcesso> },
      { path: 'portal', element: <ExigeAcesso area="portal"><Portal /></ExigeAcesso> },
      { path: 'config', element: <ExigeAcesso area="config"><Configuracoes /></ExigeAcesso> },
      { path: '*', element: <NaoEncontrado /> },
    ],
  },
]);

export function App() {
  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  );
}
