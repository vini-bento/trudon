import { createHashRouter, RouterProvider, Link } from 'react-router-dom';
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
      { index: true, element: <Dashboard /> },
      { path: 'empresas', element: <Empresas /> },
      { path: 'contabilidade', element: <Contabilidade /> },
      { path: 'fiscal', element: <Fiscal /> },
      { path: 'folha', element: <Folha /> },
      { path: 'honorarios', element: <Honorarios /> },
      { path: 'obrigacoes', element: <Obrigacoes /> },
      { path: 'portal', element: <Portal /> },
      { path: 'config', element: <Configuracoes /> },
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
