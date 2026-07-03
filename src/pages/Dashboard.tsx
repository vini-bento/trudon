import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Receipt,
  CalendarClock,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, PageHeader, Badge, cx } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import { resumoHonorarios, fluxoCaixa } from '@/lib/finance';
import { gerarDRE } from '@/lib/accounting';
import { planoDeContas } from '@/data/planoDeContas';
import { gerarInsights, type SeveridadeInsight } from '@/features/ia/engine';
import { formatBRL, formatCompetencia, formatPercent } from '@/lib/format';
import { tomObrigacao } from '@/lib/labels';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const CORES_REGIME: Record<string, string> = {
  'Simples Nacional': '#0ea5e9',
  'Lucro Presumido': '#c8902f',
  'Lucro Real': '#647082',
  MEI: '#10b981',
};

// Hierarquia visual dos insights por severidade: crítico usa cor funcional
// (vermelho); atenção se distingue pelo peso, não por cor; neutro é discreto.
const ESTILO_SEVERIDADE: Record<SeveridadeInsight, string> = {
  critico: 'font-medium text-red-700',
  atencao: 'font-medium text-graphite-900',
  neutro: 'text-graphite-600',
};

export function Dashboard() {
  const { empresas, cobrancas, obrigacoes, lancamentos } = useStore();

  const ativas = empresas.filter((e) => e.situacao === 'Ativa').length;
  const resumo = useMemo(() => resumoHonorarios(cobrancas), [cobrancas]);
  const dre = useMemo(() => gerarDRE(planoDeContas, lancamentos), [lancamentos]);

  const fluxo = useMemo(
    () =>
      fluxoCaixa(cobrancas).map((p) => ({
        ...p,
        rotulo: formatCompetencia(p.competencia),
      })),
    [cobrancas],
  );

  const obrigacoesPendentes = obrigacoes.filter(
    (o) => o.status !== 'Concluída',
  );
  const atrasadas = obrigacoes.filter((o) => o.status === 'Atrasada').length;

  const distribuicaoRegime = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const e of empresas) mapa.set(e.regime, (mapa.get(e.regime) ?? 0) + 1);
    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
  }, [empresas]);

  const proximas = useMemo(
    () =>
      obrigacoes
        .filter((o) => o.status !== 'Concluída')
        .map((o) => ({
          o,
          dias: differenceInCalendarDays(parseISO(o.vencimento), new Date()),
        }))
        .sort((a, b) => a.dias - b.dias)
        .slice(0, 6),
    [obrigacoes],
  );

  const insights = useMemo(
    () => gerarInsights({ empresas, lancamentos, cobrancas, obrigacoes }),
    [empresas, lancamentos, cobrancas, obrigacoes],
  );

  const empresaNome = (id: string) =>
    empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        descricao="Visão geral do escritório — indicadores em tempo real."
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Clientes ativos"
          valor={String(ativas)}
          icone={<Building2 size={20} />}
          detalhe={
            <span className="text-graphite-500">
              {empresas.length} no total da carteira
            </span>
          }
        />
        <StatCard
          titulo="A receber"
          valor={formatBRL(resumo.pendente + resumo.atrasado)}
          tom="gold"
          icone={<Receipt size={20} />}
          detalhe={
            <span className="text-graphite-500">
              {formatBRL(resumo.recebido)} já recebido
            </span>
          }
        />
        <StatCard
          titulo="Obrigações em aberto"
          valor={String(obrigacoesPendentes.length)}
          tom={atrasadas ? 'red' : 'blue'}
          icone={<CalendarClock size={20} />}
          detalhe={
            atrasadas ? (
              <span className="font-medium text-red-600">
                {atrasadas} em atraso
              </span>
            ) : (
              <span className="text-emerald-600">nenhuma atrasada</span>
            )
          }
        />
        <StatCard
          titulo="Resultado do mês"
          valor={formatBRL(dre.resultado)}
          tom={dre.resultado >= 0 ? 'green' : 'red'}
          icone={<TrendingUp size={20} />}
          detalhe={
            <span className="text-graphite-500">
              margem {formatPercent(dre.margem)}
            </span>
          }
        />
      </div>

      {/* Insights da Trudon IA — superfície recuada (papel consultivo) */}
      <Card className="mt-6 border-graphite-200 bg-graphite-50 p-5 shadow-none">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-gold-600" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
            Insights da Trudon IA
          </h2>
        </div>
        <ul className="space-y-2">
          {insights.map(({ texto, severidade }, i) => (
            <li
              key={i}
              className={cx('text-sm leading-relaxed', ESTILO_SEVERIDADE[severidade])}
            >
              {texto}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fluxo de caixa */}
        <Card className="p-5 shadow-none lg:col-span-2">
          <h2 className="mb-4 font-semibold text-graphite-900">
            Honorários — orçado × realizado
          </h2>
          <ResponsiveContainer width="100%" height={280}>
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

        {/* Distribuição por regime */}
        <Card className="p-5 shadow-none">
          <h2 className="mb-4 font-semibold text-graphite-900">
            Clientes por regime
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribuicaoRegime}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {distribuicaoRegime.map((d) => (
                  <Cell key={d.name} fill={CORES_REGIME[d.name] ?? '#647082'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n) => [`${v} cliente(s)`, n]}
                contentStyle={{ borderRadius: 12, border: '1px solid #d4d8dd', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Próximas obrigações */}
      <Card className="mt-6 overflow-hidden shadow-none">
        <div className="flex items-center justify-between border-b border-graphite-100 px-5 py-3">
          <h2 className="font-semibold text-graphite-900">Próximas obrigações</h2>
          <Link
            to="/obrigacoes"
            className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            Ver todas <ArrowRight size={15} />
          </Link>
        </div>
        <div className="divide-y divide-graphite-100">
          {proximas.map(({ o, dias }) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-graphite-900">
                  {o.titulo}
                </p>
                <p className="truncate text-xs text-graphite-500">
                  {empresaNome(o.empresaId)} · {o.departamento}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={
                    dias < 0
                      ? 'text-xs font-semibold tabular-nums text-red-600'
                      : dias <= 3
                        ? 'text-xs font-semibold tabular-nums text-amber-600'
                        : 'text-xs tabular-nums text-graphite-500'
                  }
                >
                  {dias < 0
                    ? `${Math.abs(dias)}d atrás`
                    : dias === 0
                      ? 'hoje'
                      : `em ${dias}d`}
                </span>
                <Badge tone={tomObrigacao(o.status)}>{o.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
