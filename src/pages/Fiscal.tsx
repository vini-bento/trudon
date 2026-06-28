import { useMemo, useState } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  cx,
} from '@/components/ui';
import { useStore } from '@/store/useStore';
import {
  apurarSimples,
  apurarMEI,
  apurarPresumido,
  apurarReal,
  presuncoesPresumido,
  type AnexoSimples,
  type ResultadoApuracao,
  type Tributo,
  type PassoCalculo,
} from '@/lib/fiscal';
import { formatBRL, formatNumber, formatPercent } from '@/lib/format';

/** Converte texto digitado (1.234,56 ou 1234.56 ou 1234) em número. */
function parseMoeda(s: string): number {
  if (!s) return 0;
  const limpo = s.replace(/[^\d.,-]/g, '');
  // Se tem vírgula, ela é o separador decimal; pontos são milhares.
  const normal = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;
  const n = Number(normal);
  return Number.isFinite(n) ? n : 0;
}

const ANEXOS: { valor: AnexoSimples; rotulo: string }[] = [
  { valor: 'I', rotulo: 'Anexo I — Comércio' },
  { valor: 'II', rotulo: 'Anexo II — Indústria' },
  { valor: 'III', rotulo: 'Anexo III — Serviços' },
  { valor: 'IV', rotulo: 'Anexo IV — Construção, limpeza, vigilância' },
  { valor: 'V', rotulo: 'Anexo V — Serviços (sujeito a Fator R)' },
];

const competenciaAtual = new Date().toISOString().slice(0, 7);

export function Fiscal() {
  const { empresas } = useStore();
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '');
  const [competencia, setCompetencia] = useState(competenciaAtual);

  // Campos de entrada (texto, convertidos na hora do cálculo).
  const [anexo, setAnexo] = useState<AnexoSimples>('III');
  const [fatorR, setFatorR] = useState(false);
  const [rbt12, setRbt12] = useState('');
  const [folha12, setFolha12] = useState('');
  const [receitaMes, setReceitaMes] = useState('');
  const [atividadeMEI, setAtividadeMEI] = useState<
    'comercio_industria' | 'servicos' | 'comercio_servicos'
  >('servicos');
  const [atividadePresumido, setAtividadePresumido] = useState(
    presuncoesPresumido[0].chave,
  );
  const [receitaTrimestre, setReceitaTrimestre] = useState('');
  const [issAliquota, setIssAliquota] = useState('');
  const [issBase, setIssBase] = useState('');
  const [lucroReal, setLucroReal] = useState('');
  const [baseCreditos, setBaseCreditos] = useState('');

  const empresa = empresas.find((e) => e.id === empresaId);
  const regime = empresa?.regime;

  const resultado: ResultadoApuracao | null = useMemo(() => {
    if (!empresa || !regime) return null;
    switch (regime) {
      case 'Simples Nacional':
        return apurarSimples({
          competencia,
          anexo,
          sujeitoFatorR: fatorR,
          rbt12: parseMoeda(rbt12),
          folha12: fatorR ? parseMoeda(folha12) : undefined,
          receitaMes: parseMoeda(receitaMes),
        });
      case 'MEI':
        return apurarMEI({ competencia, atividade: atividadeMEI });
      case 'Lucro Presumido':
        return apurarPresumido({
          competencia,
          atividade: atividadePresumido,
          receitaTrimestre: parseMoeda(receitaTrimestre),
          receitaMes: parseMoeda(receitaMes),
          issAliquota: issAliquota ? parseMoeda(issAliquota) : undefined,
          issBase: issAliquota ? parseMoeda(issBase || receitaMes) : undefined,
        });
      case 'Lucro Real':
        return apurarReal({
          competencia,
          lucroReal: parseMoeda(lucroReal),
          receitaMes: parseMoeda(receitaMes),
          baseCreditos: parseMoeda(baseCreditos),
        });
      default:
        return null;
    }
  }, [
    empresa,
    regime,
    competencia,
    anexo,
    fatorR,
    rbt12,
    folha12,
    receitaMes,
    atividadeMEI,
    atividadePresumido,
    receitaTrimestre,
    issAliquota,
    issBase,
    lucroReal,
    baseCreditos,
  ]);

  const mensais = resultado?.tributos.filter((t) => t.periodicidade === 'Mensal') ?? [];
  const trimestrais =
    resultado?.tributos.filter((t) => t.periodicidade === 'Trimestral') ?? [];
  const totalMensal = mensais.reduce((s, t) => s + t.valor, 0);
  const totalTrimestral = trimestrais.reduce((s, t) => s + t.valor, 0);

  if (empresas.length === 0) {
    return (
      <div>
        <PageHeader titulo="Fiscal" />
        <EmptyState
          icone={<Calculator size={40} />}
          titulo="Nenhum cliente cadastrado"
          descricao="Cadastre um cliente para apurar os tributos do período."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Apuração Fiscal"
        descricao="Cálculo dos tributos conforme o regime do cliente, com memória de cálculo conferível."
      />

      {/* Seletores principais */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Cliente"
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
        >
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia || e.razaoSocial}
            </option>
          ))}
        </Select>
        <Input
          label="Competência"
          type="month"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
        />
        <div>
          <span className="label">Regime tributário</span>
          <div className="flex h-[42px] items-center">
            {regime && (
              <Badge tone="gold" className="text-sm">
                {regime}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Formulário de entradas — depende do regime */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-graphite-900">
            <Receipt size={18} className="text-gold-600" /> Dados do período
          </h2>

          {regime === 'Simples Nacional' && (
            <div className="space-y-4">
              <Select
                label="Anexo da atividade"
                value={anexo}
                onChange={(e) => setAnexo(e.target.value as AnexoSimples)}
              >
                {ANEXOS.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.rotulo}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm text-graphite-700">
                <input
                  type="checkbox"
                  checked={fatorR}
                  onChange={(e) => setFatorR(e.target.checked)}
                  className="h-4 w-4 rounded border-graphite-300 text-gold-600 focus:ring-gold-400"
                />
                Atividade sujeita ao Fator R (migra entre Anexo III e V)
              </label>
              <Input
                label="RBT12 — receita dos últimos 12 meses (R$)"
                inputMode="decimal"
                value={rbt12}
                onChange={(e) => setRbt12(e.target.value)}
                placeholder="0,00"
              />
              {fatorR && (
                <Input
                  label="Folha dos últimos 12 meses (R$)"
                  inputMode="decimal"
                  value={folha12}
                  onChange={(e) => setFolha12(e.target.value)}
                  placeholder="0,00"
                />
              )}
              <Input
                label="Receita do mês (R$)"
                inputMode="decimal"
                value={receitaMes}
                onChange={(e) => setReceitaMes(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}

          {regime === 'MEI' && (
            <div className="space-y-4">
              <Select
                label="Atividade"
                value={atividadeMEI}
                onChange={(e) =>
                  setAtividadeMEI(e.target.value as typeof atividadeMEI)
                }
              >
                <option value="servicos">Serviços (ISS)</option>
                <option value="comercio_industria">
                  Comércio / Indústria (ICMS)
                </option>
                <option value="comercio_servicos">
                  Comércio e Serviços (ICMS + ISS)
                </option>
              </Select>
              <p className="text-sm text-graphite-500">
                O DAS-SIMEI é um valor fixo mensal, independente do faturamento
                (dentro do limite do MEI).
              </p>
            </div>
          )}

          {regime === 'Lucro Presumido' && (
            <div className="space-y-4">
              <Select
                label="Atividade (define a presunção)"
                value={atividadePresumido}
                onChange={(e) => setAtividadePresumido(e.target.value)}
              >
                {presuncoesPresumido.map((p) => (
                  <option key={p.chave} value={p.chave}>
                    {p.rotulo} — IRPJ {formatNumber(p.presuncaoIRPJ, 1)}% / CSLL{' '}
                    {formatNumber(p.presuncaoCSLL, 1)}%
                  </option>
                ))}
              </Select>
              <Input
                label="Receita do trimestre — base IRPJ/CSLL (R$)"
                inputMode="decimal"
                value={receitaTrimestre}
                onChange={(e) => setReceitaTrimestre(e.target.value)}
                placeholder="0,00"
              />
              <Input
                label="Faturamento do mês — base PIS/COFINS (R$)"
                inputMode="decimal"
                value={receitaMes}
                onChange={(e) => setReceitaMes(e.target.value)}
                placeholder="0,00"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Alíquota ISS (%)"
                  inputMode="decimal"
                  value={issAliquota}
                  onChange={(e) => setIssAliquota(e.target.value)}
                  placeholder="ex.: 5"
                />
                <Input
                  label="Base do ISS (R$)"
                  inputMode="decimal"
                  value={issBase}
                  onChange={(e) => setIssBase(e.target.value)}
                  placeholder="serviços"
                />
              </div>
              <p className="text-xs text-graphite-400">
                ISS é municipal (2% a 5%): informe a alíquota da cidade do cliente.
              </p>
            </div>
          )}

          {regime === 'Lucro Real' && (
            <div className="space-y-4">
              <Input
                label="Lucro real do período — base IRPJ/CSLL (R$)"
                inputMode="decimal"
                value={lucroReal}
                onChange={(e) => setLucroReal(e.target.value)}
                placeholder="0,00"
              />
              <Input
                label="Faturamento do mês — base PIS/COFINS (R$)"
                inputMode="decimal"
                value={receitaMes}
                onChange={(e) => setReceitaMes(e.target.value)}
                placeholder="0,00"
              />
              <Input
                label="Base de créditos PIS/COFINS (R$)"
                inputMode="decimal"
                value={baseCreditos}
                onChange={(e) => setBaseCreditos(e.target.value)}
                placeholder="insumos, energia…"
              />
              <p className="text-xs text-graphite-400">
                A base do lucro real vem da escrituração (adições/exclusões do
                e-LALUR). Informe o valor já ajustado.
              </p>
            </div>
          )}
        </Card>

        {/* Resultado */}
        <div className="space-y-4 lg:col-span-3">
          {/* Totais */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm text-graphite-500">A recolher no mês</p>
              <p className="mt-1 text-3xl font-bold text-graphite-900">
                {formatBRL(totalMensal)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-graphite-500">
                Trimestral (IRPJ/CSLL)
              </p>
              <p className="mt-1 text-3xl font-bold text-graphite-900">
                {trimestrais.length ? formatBRL(totalTrimestral) : '—'}
              </p>
            </Card>
          </div>

          {/* Avisos */}
          {resultado?.avisos.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{a}</span>
            </div>
          ))}

          {/* Tributos com memória de cálculo */}
          {resultado && resultado.tributos.length > 0 ? (
            <div className="space-y-3">
              {resultado.tributos.map((t) => (
                <TributoCard key={t.sigla} tributo={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icone={<Calculator size={40} />}
              titulo="Preencha os dados do período"
              descricao="Os tributos aparecerão aqui com a memória de cálculo para conferência."
            />
          )}

          <p className="flex items-center gap-2 rounded-lg bg-graphite-50 px-4 py-3 text-xs text-graphite-500">
            <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
            Os valores são apurados a partir das tabelas oficiais e devem ser
            conferidos pelo responsável técnico antes da transmissão e do
            recolhimento.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatPasso(p: PassoCalculo): string {
  if (p.texto != null) return p.texto;
  if (p.valor == null) return '';
  if (p.tipo === 'moeda') return formatBRL(p.valor);
  if (p.tipo === 'percentual') return formatPercent(p.valor, 3);
  return formatNumber(p.valor, 2);
}

function TributoCard({ tributo }: { tributo: Tributo }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-graphite-50/60"
      >
        <div className="flex items-center gap-3">
          <span className="text-graphite-400">
            {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
          <div>
            <p className="font-semibold text-graphite-900">
              {tributo.sigla}{' '}
              <span className="font-normal text-graphite-500">
                · {tributo.nome}
              </span>
            </p>
            <p className="text-xs text-graphite-400">
              {tributo.periodicidade} · guia {tributo.guia}
            </p>
          </div>
        </div>
        <span className="text-lg font-bold tabular-nums text-graphite-900">
          {formatBRL(tributo.valor)}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-graphite-100 bg-graphite-50/40 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-400">
            Memória de cálculo
          </p>
          <dl className="space-y-1 text-sm">
            {tributo.memoria.map((p, i) => (
              <div
                key={i}
                className={cx(
                  'flex items-center justify-between gap-4 py-0.5',
                  p.destaque &&
                    'mt-1 border-t border-graphite-200 pt-2 font-semibold text-graphite-900',
                )}
              >
                <dt className="text-graphite-600">{p.rotulo}</dt>
                <dd className="tabular-nums text-graphite-800">
                  {formatPasso(p)}
                </dd>
              </div>
            ))}
          </dl>
          {tributo.observacao && (
            <p className="mt-2 text-xs text-graphite-400">{tributo.observacao}</p>
          )}
        </div>
      )}
    </Card>
  );
}
