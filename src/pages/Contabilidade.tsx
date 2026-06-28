import { useMemo, useState } from 'react';
import { Plus, Trash2, BookOpenCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  cx,
} from '@/components/ui';
import { useStore } from '@/store/useStore';
import { planoDeContas } from '@/data/planoDeContas';
import {
  gerarBalancete,
  gerarDRE,
  totaisBalancete,
} from '@/lib/accounting';
import type { Lancamento } from '@/data/types';
import { formatBRL, formatDate, formatPercent } from '@/lib/format';

type Aba = 'balancete' | 'dre' | 'lancamentos';

const contasAnaliticas = planoDeContas.filter((c) => c.analitica);
const nomeConta = (id: string) =>
  planoDeContas.find((c) => c.id === id)?.nome ?? id;
const codigoConta = (id: string) =>
  planoDeContas.find((c) => c.id === id)?.codigo ?? '';

export function Contabilidade() {
  const { empresas, lancamentos, adicionarLancamento, removerLancamento } =
    useStore();
  const ativas = empresas;
  const [empresaId, setEmpresaId] = useState(ativas[0]?.id ?? '');
  const [aba, setAba] = useState<Aba>('balancete');
  const [modal, setModal] = useState(false);

  const lancEmpresa = useMemo(
    () => lancamentos.filter((l) => l.empresaId === empresaId),
    [lancamentos, empresaId],
  );
  const balancete = useMemo(
    () => gerarBalancete(planoDeContas, lancEmpresa),
    [lancEmpresa],
  );
  const totais = useMemo(() => totaisBalancete(balancete), [balancete]);
  const dre = useMemo(() => gerarDRE(planoDeContas, lancEmpresa), [lancEmpresa]);

  const empresa = empresas.find((e) => e.id === empresaId);

  if (!empresa) {
    return (
      <div>
        <PageHeader titulo="Contabilidade" />
        <EmptyState
          icone={<BookOpenCheck size={40} />}
          titulo="Nenhuma empresa cadastrada"
          descricao="Cadastre uma empresa para escriturar e gerar demonstrativos."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Contabilidade"
        descricao="Escrituração, balancete e DRE por empresa."
        acoes={
          aba === 'lancamentos' && (
            <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>
              Novo lançamento
            </Button>
          )
        }
      />

      {/* Seletor de empresa */}
      <div className="mb-5 max-w-sm">
        <Select
          label="Empresa"
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
        >
          {ativas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia}
            </option>
          ))}
        </Select>
      </div>

      {/* Abas */}
      <div className="mb-5 flex gap-1 border-b border-graphite-200">
        {(
          [
            ['balancete', 'Balancete'],
            ['dre', 'DRE'],
            ['lancamentos', 'Lançamentos'],
          ] as [Aba, string][]
        ).map(([id, rotulo]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cx(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              aba === id
                ? 'border-gold-500 text-graphite-900'
                : 'border-transparent text-graphite-500 hover:text-graphite-800',
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {lancEmpresa.length === 0 ? (
        <EmptyState
          icone={<BookOpenCheck size={40} />}
          titulo="Sem lançamentos"
          descricao="Esta empresa ainda não tem lançamentos no período."
          acao={
            <Button icon={<Plus size={18} />} onClick={() => setModal(true)}>
              Novo lançamento
            </Button>
          }
        />
      ) : aba === 'balancete' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                  <th className="px-5 py-3 font-semibold">Conta</th>
                  <th className="px-5 py-3 text-right font-semibold">Débito</th>
                  <th className="px-5 py-3 text-right font-semibold">Crédito</th>
                  <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {balancete.map((l) => (
                  <tr key={l.conta.id} className="hover:bg-graphite-50/60">
                    <td className="px-5 py-2.5">
                      <span className="tabular-nums text-graphite-400">
                        {l.conta.codigo}
                      </span>{' '}
                      <span className="text-graphite-800">{l.conta.nome}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-graphite-600">
                      {l.debito ? formatBRL(l.debito) : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-graphite-600">
                      {l.credito ? formatBRL(l.credito) : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums text-graphite-900">
                      {formatBRL(l.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-graphite-300 bg-graphite-50 font-semibold">
                  <td className="px-5 py-3 text-graphite-900">
                    Totais{' '}
                    {totais.balanceado ? (
                      <Badge tone="green" className="ml-2">
                        <CheckCircle2 size={12} /> Fecha
                      </Badge>
                    ) : (
                      <Badge tone="red" className="ml-2">
                        <AlertCircle size={12} /> Não fecha
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-graphite-900">
                    {formatBRL(totais.totalDebito)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-graphite-900">
                    {formatBRL(totais.totalCredito)}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ) : aba === 'dre' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 font-semibold text-graphite-900">
              Demonstração do Resultado
            </h2>
            <dl className="space-y-1 text-sm">
              <LinhaDRE rotulo="Receita Bruta" valor={dre.receitaBruta} forte />
              {dre.linhasReceita.map((l) => (
                <LinhaDRE
                  key={l.conta.id}
                  rotulo={l.conta.nome}
                  valor={l.saldo}
                  recuo
                />
              ))}
              <LinhaDRE
                rotulo="(−) Despesas"
                valor={-dre.despesasTotais}
                forte
              />
              {dre.linhasDespesa.map((l) => (
                <LinhaDRE
                  key={l.conta.id}
                  rotulo={l.conta.nome}
                  valor={-l.saldo}
                  recuo
                />
              ))}
              <div className="my-2 border-t border-graphite-200" />
              <LinhaDRE
                rotulo={dre.resultado >= 0 ? 'Lucro do período' : 'Prejuízo do período'}
                valor={dre.resultado}
                forte
                destaque
              />
            </dl>
          </Card>
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-sm text-graphite-500">Margem líquida</p>
              <p
                className={cx(
                  'mt-1 text-3xl font-bold',
                  dre.resultado >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {formatPercent(dre.margem)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-graphite-500">Resultado</p>
              <p
                className={cx(
                  'mt-1 text-2xl font-bold',
                  dre.resultado >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {formatBRL(dre.resultado)}
              </p>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Histórico</th>
                  <th className="px-5 py-3 font-semibold">Débito</th>
                  <th className="px-5 py-3 font-semibold">Crédito</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {[...lancEmpresa]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((l) => (
                    <tr key={l.id} className="hover:bg-graphite-50/60">
                      <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-graphite-600">
                        {formatDate(l.data)}
                      </td>
                      <td className="px-5 py-2.5 text-graphite-800">
                        {l.historico}
                        {l.centroCusto && (
                          <span className="ml-2 text-xs text-graphite-400">
                            · {l.centroCusto}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-graphite-600">
                        <span className="tabular-nums text-graphite-400">
                          {codigoConta(l.contaDebitoId)}
                        </span>{' '}
                        {nomeConta(l.contaDebitoId)}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-graphite-600">
                        <span className="tabular-nums text-graphite-400">
                          {codigoConta(l.contaCreditoId)}
                        </span>{' '}
                        {nomeConta(l.contaCreditoId)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium tabular-nums text-graphite-900">
                        {formatBRL(l.valor)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => removerLancamento(l.id)}
                          className="rounded-lg p-1.5 text-graphite-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remover lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NovoLancamento
        aberto={modal}
        onFechar={() => setModal(false)}
        onSalvar={(dados) =>
          adicionarLancamento({
            ...dados,
            id: `l-${Date.now()}`,
            empresaId,
          })
        }
      />
    </div>
  );
}

function LinhaDRE({
  rotulo,
  valor,
  forte,
  recuo,
  destaque,
}: {
  rotulo: string;
  valor: number;
  forte?: boolean;
  recuo?: boolean;
  destaque?: boolean;
}) {
  return (
    <div
      className={cx(
        'flex items-center justify-between py-1',
        recuo && 'pl-4 text-graphite-500',
        forte && 'font-semibold text-graphite-900',
      )}
    >
      <dt className={cx(recuo && 'text-sm')}>{rotulo}</dt>
      <dd
        className={cx(
          'tabular-nums',
          destaque && (valor >= 0 ? 'text-emerald-600' : 'text-red-600'),
        )}
      >
        {formatBRL(valor)}
      </dd>
    </div>
  );
}

function NovoLancamento({
  aberto,
  onFechar,
  onSalvar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (l: Omit<Lancamento, 'id' | 'empresaId'>) => void;
}) {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [historico, setHistorico] = useState('');
  const [debito, setDebito] = useState(contasAnaliticas[0].id);
  const [credito, setCredito] = useState(contasAnaliticas[1].id);
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  function salvar() {
    const v = Number(valor.replace(',', '.'));
    if (!historico.trim()) return setErro('Informe o histórico.');
    if (!(v > 0)) return setErro('O valor deve ser maior que zero.');
    if (debito === credito)
      return setErro('As contas de débito e crédito devem ser diferentes.');
    onSalvar({
      data,
      historico: historico.trim(),
      contaDebitoId: debito,
      contaCreditoId: credito,
      valor: v,
    });
    setHistorico('');
    setValor('');
    setErro('');
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo lançamento" largura="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <Input
            label="Valor (R$)"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <Input
          label="Histórico"
          value={historico}
          onChange={(e) => setHistorico(e.target.value)}
          placeholder="Descrição do lançamento"
        />
        <Select
          label="Conta de débito"
          value={debito}
          onChange={(e) => setDebito(e.target.value)}
        >
          {contasAnaliticas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nome}
            </option>
          ))}
        </Select>
        <Select
          label="Conta de crédito"
          value={credito}
          onChange={(e) => setCredito(e.target.value)}
        >
          {contasAnaliticas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nome}
            </option>
          ))}
        </Select>
        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Lançar</Button>
        </div>
      </div>
    </Modal>
  );
}
