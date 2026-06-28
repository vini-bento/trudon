import { useMemo, useState } from 'react';
import { CalendarClock, Check, Play, RotateCcw } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, Select, cx } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import { usuarios } from '@/data/seed';
import type { Departamento, Obrigacao, StatusObrigacao } from '@/data/types';
import { formatDate } from '@/lib/format';
import { tomObrigacao } from '@/lib/labels';
import { atualizarStatusObrigacaoApi } from '@/lib/obrigacoesApi';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const DEPARTAMENTOS: Departamento[] = [
  'Fiscal',
  'Contábil',
  'Pessoal',
  'Societário',
  'Financeiro',
];

export function Obrigacoes() {
  const { empresas, obrigacoes, definirStatusObrigacao } = useStore();
  const [filtroDep, setFiltroDep] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');

  // Muda o status da obrigação: persiste no banco e atualiza o estado local.
  async function mudarStatus(o: Obrigacao, status: StatusObrigacao) {
    const atualizada: Obrigacao = {
      ...o,
      status,
      concluidaEm:
        status === 'Concluída' ? new Date().toISOString().slice(0, 10) : undefined,
    };
    try {
      await atualizarStatusObrigacaoApi(atualizada);
    } catch (e) {
      console.warn('Status alterado apenas localmente (banco indisponível).', e);
    }
    definirStatusObrigacao(o.id, status);
  }

  const filtradas = useMemo(
    () =>
      obrigacoes
        .filter((o) => !filtroDep || o.departamento === filtroDep)
        .filter((o) => !filtroStatus || o.status === filtroStatus)
        .filter((o) => !filtroEmpresa || o.empresaId === filtroEmpresa)
        .map((o) => ({
          o,
          dias: differenceInCalendarDays(parseISO(o.vencimento), new Date()),
        }))
        .sort((a, b) => {
          // atrasadas/pendentes primeiro, depois por vencimento
          const peso = (s: StatusObrigacao) =>
            s === 'Atrasada' ? 0 : s === 'Em andamento' ? 1 : s === 'Pendente' ? 2 : 3;
          return peso(a.o.status) - peso(b.o.status) || a.dias - b.dias;
        }),
    [obrigacoes, filtroDep, filtroStatus, filtroEmpresa],
  );

  const totais = useMemo(() => {
    const atrasadas = obrigacoes.filter((o) => o.status === 'Atrasada').length;
    const emAberto = obrigacoes.filter((o) => o.status !== 'Concluída').length;
    const concluidas = obrigacoes.filter((o) => o.status === 'Concluída').length;
    return { atrasadas, emAberto, concluidas };
  }, [obrigacoes]);

  const empresaNome = (id: string) =>
    empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  const responsavel = (id: string) =>
    usuarios.find((u) => u.id === id)?.iniciais ?? '—';

  return (
    <div>
      <PageHeader
        titulo="Obrigações"
        descricao="Calendário de entregas e acompanhamento por departamento."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          titulo="Em atraso"
          valor={String(totais.atrasadas)}
          tom={totais.atrasadas ? 'red' : 'green'}
          icone={<CalendarClock size={20} />}
        />
        <StatCard
          titulo="Em aberto"
          valor={String(totais.emAberto)}
          tom="gold"
          icone={<Play size={20} />}
        />
        <StatCard
          titulo="Concluídas"
          valor={String(totais.concluidas)}
          tom="green"
          icone={<Check size={20} />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-4 mt-6 flex flex-wrap items-end gap-3">
        <Select
          label="Empresa"
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="w-auto"
        >
          <option value="">Todas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia}
            </option>
          ))}
        </Select>
        <Select
          label="Departamento"
          value={filtroDep}
          onChange={(e) => setFiltroDep(e.target.value)}
          className="w-auto"
        >
          <option value="">Todos</option>
          {DEPARTAMENTOS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
        <Select
          label="Status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-auto"
        >
          <option value="">Todos</option>
          <option>Pendente</option>
          <option>Em andamento</option>
          <option>Concluída</option>
          <option>Atrasada</option>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icone={<CalendarClock size={40} />}
          titulo="Nenhuma obrigação"
          descricao="Não há obrigações para os filtros selecionados."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                  <th className="px-5 py-3 font-semibold">Obrigação</th>
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">Vencimento</th>
                  <th className="px-5 py-3 font-semibold">Resp.</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {filtradas.map(({ o, dias }) => (
                  <tr key={o.id} className="hover:bg-graphite-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-graphite-900">{o.titulo}</p>
                      <p className="text-xs text-graphite-500">
                        {o.tipo} · {o.departamento}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-graphite-600">
                      {empresaNome(o.empresaId)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="tabular-nums text-graphite-700">
                        {formatDate(o.vencimento)}
                      </span>
                      {o.status !== 'Concluída' && (
                        <span
                          className={cx(
                            'ml-2 text-xs font-medium',
                            dias < 0
                              ? 'text-red-600'
                              : dias <= 3
                                ? 'text-amber-600'
                                : 'text-graphite-400',
                          )}
                        >
                          {dias < 0
                            ? `${Math.abs(dias)}d atrás`
                            : dias === 0
                              ? 'hoje'
                              : `em ${dias}d`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-graphite-100 text-xs font-bold text-graphite-600"
                        title={
                          usuarios.find((u) => u.id === o.responsavelId)?.nome
                        }
                      >
                        {responsavel(o.responsavelId)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={tomObrigacao(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {o.status !== 'Concluída' ? (
                          <>
                            {o.status !== 'Em andamento' && (
                              <button
                                onClick={() =>
                                  mudarStatus(o, 'Em andamento')
                                }
                                className="rounded-lg p-1.5 text-graphite-400 hover:bg-sky-50 hover:text-sky-600"
                                aria-label="Marcar em andamento"
                                title="Em andamento"
                              >
                                <Play size={16} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                mudarStatus(o, 'Concluída')
                              }
                              className="rounded-lg p-1.5 text-graphite-400 hover:bg-emerald-50 hover:text-emerald-600"
                              aria-label="Concluir"
                              title="Concluir"
                            >
                              <Check size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              mudarStatus(o, 'Pendente')
                            }
                            className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
                            aria-label="Reabrir"
                            title="Reabrir"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
