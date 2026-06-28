import { useState } from 'react';
import { RotateCcw, ShieldCheck, Database, Sparkles } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { usuarios } from '@/data/seed';

export function Configuracoes() {
  const restaurar = useStore((s) => s.restaurarExemplo);
  const [feito, setFeito] = useState(false);

  function onRestaurar() {
    if (
      window.confirm(
        'Restaurar os dados de exemplo? Todas as alterações feitas nesta sessão serão descartadas.',
      )
    ) {
      restaurar();
      setFeito(true);
      setTimeout(() => setFeito(false), 2500);
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Configurações"
        descricao="Preferências do ambiente e equipe do escritório."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Database size={18} className="text-gold-600" />
            <h2 className="font-semibold text-graphite-900">Dados de exemplo</h2>
          </div>
          <p className="text-sm text-graphite-600">
            Este ambiente usa dados fictícios, salvos apenas no seu navegador.
            Você pode editar à vontade — nada sai do seu dispositivo. Para voltar
            ao conjunto original de demonstração, restaure abaixo.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="secondary"
              icon={<RotateCcw size={16} />}
              onClick={onRestaurar}
            >
              Restaurar dados de exemplo
            </Button>
            {feito && (
              <span className="text-sm font-medium text-emerald-600">
                Dados restaurados!
              </span>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-graphite-900">
              Segurança & próximos passos
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-graphite-600">
            <li className="flex gap-2">
              <span className="text-gold-600">•</span> Fase atual: demonstração
              local, sem dados reais de clientes.
            </li>
            <li className="flex gap-2">
              <span className="text-gold-600">•</span> Fase de produção: login com
              perfis de acesso, criptografia, trilha de auditoria e backup.
            </li>
            <li className="flex gap-2">
              <span className="text-gold-600">•</span> Adequação à LGPD antes de
              qualquer dado real ser inserido.
            </li>
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-gold-600" />
            <h2 className="font-semibold text-graphite-900">Equipe</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-lg border border-graphite-200 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-graphite-900 text-sm font-bold text-gold-300">
                  {u.iniciais}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-graphite-900">
                    {u.nome}
                  </p>
                  <p className="truncate text-xs text-graphite-500">
                    {u.cargo} · {u.departamento}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
