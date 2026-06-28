import { useMemo, useState } from 'react';
import { Receipt, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Button, Card, PageHeader, Select } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import { resumoHonorarios, fluxoCaixa } from '@/lib/finance';
import {
  formatBRL,
  formatCompetencia,
  formatDate,
  formatPercent,
} from '@/lib/format';
import { tomCobranca } from '@/lib/labels';

export function Honorarios() {
  const { empresas, cobrancas, alternarPagamento } = useStore();
  const [filtroComp, setFiltroComp] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const competencias = useMemo(
    () =>
      [...new Set(cobrancas.map((c) => c.competencia))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [cobrancas],
  );

  const filtradas = useMemo(
    () =>
      cobrancas
        .filter((c) => !filtroComp || c.competencia === filtroComp)
        .filter((c) => !filtroStatus || c.status === filtroStatus)
        .sort(
          (a, b) =>
            b.competencia.localeCompare(a.competencia) ||
            a.vencimento.localeCompare(b.vencimento),
        ),
    [cobrancas, filtroComp, filtroStatus],
  );

  const resumo = useMemo(() => resumoHonorarios(filtradas), [filtradas]);
  const fluxo = useMemo(
    () =>
      fluxoCaixa(cobrancas).map((p) => ({
        ...p,
        rotulo: formatCompetencia(p.competencia),
      })),
    [cobrancas],
  );

  const empresaNome = (id: string) =>
    empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';

  return (
    <div>
      <PageHeader
        titulo="Honorários"
        descricao="Faturamento, recebíveis e inadimplência da carteira."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Faturado"
          valor={formatBRL(resumo.totalMes)}
          tom="gold"
          icone={<Receipt size={20} />}
        />
        <StatCard
          titulo="Recebido"
          valor={formatBRL(resumo.recebido)}
          tom="green"
          icone={<CheckCircle2 size={20} />}
        />
        <StatCard
          titulo="A receber"
          valor={formatBRL(resumo.pendente)}
          tom="blue"
          icone={<Receipt size={20} />}
        />
        <StatCard
          titulo="Inadimplência"
          valor={formatPercent(resumo.taxaInadimplencia)}
          tom={resumo.atrasado > 0 ? 'red' : 'green'}
          icone={<RotateCcw size={20} />}
          detalhe={
            <span className="text-graphite-500">
              {formatBRL(resumo.atrasado)} em atraso
            </span>
          }
        />
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 font-semibold text-graphite-900">
          Fluxo de caixa — orçado × realizado
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fluxo} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" vertical={false} />
            <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: '#647082' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#647082' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => formatBRL(v)}
              contentStyle={{ borderRadius: 12, border: '1px solid #d4d8dd', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="orcado" name="Orçado" fill="#aeb6bf" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" fill="#c8902f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Filtros */}
      <div className="mb-4 mt-6 flex flex-wrap items-end gap-3">
        <Select
          label="Competência"
          value={filtroComp}
          onChange={(e) => setFiltroComp(e.target.value)}
          className="w-auto"
        >
          <option value="">Todas</option>
          {competencias.map((c) => (
            <option key={c} value={c}>
              {formatCompetencia(c)}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-auto"
        >
          <option value="">Todos</option>
          <option>Pago</option>
          <option>Pendente</option>
          <option>Atrasado</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                <th className="px-5 py-3 font-semibold">Empresa</th>
                <th className="px-5 py-3 font-semibold">Competência</th>
                <th className="px-5 py-3 font-semibold">Vencimento</th>
                <th className="px-5 py-3 text-right font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {filtradas.map((c) => (
                <tr key={c.id} className="hover:bg-graphite-50/60">
                  <td className="px-5 py-2.5 font-medium text-graphite-900">
                    {empresaNome(c.empresaId)}
                  </td>
                  <td className="px-5 py-2.5 text-graphite-600">
                    {formatCompetencia(c.competencia)}
                  </td>
                  <td className="px-5 py-2.5 tabular-nums text-graphite-600">
                    {formatDate(c.vencimento)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium tabular-nums text-graphite-900">
                    {formatBRL(c.valor)}
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge tone={tomCobranca(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      variant={c.status === 'Pago' ? 'ghost' : 'secondary'}
                      className="!px-3 !py-1 text-xs"
                      onClick={() => alternarPagamento(c.id)}
                    >
                      {c.status === 'Pago' ? 'Estornar' : 'Dar baixa'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
