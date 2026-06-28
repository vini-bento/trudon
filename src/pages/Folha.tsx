import { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  Calculator,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  MoedaInput,
  PageHeader,
  Select,
  cx,
} from '@/components/ui';
import { useStore } from '@/store/useStore';
import {
  calcularFolhaCLT,
  MODALIDADES_FOLHA,
  type Modalidade,
  type Funcionario,
  type VariaveisMes,
  type ItemFolha,
  type PassoCalculo,
} from '@/lib/folha';
import { formatBRL, formatNumber, formatPercent, formatCPF } from '@/lib/format';

const MODALIDADES: Modalidade[] = [
  'CLT',
  'Experiência',
  'Intermitente',
  'Temporário',
  'Aprendiz',
  'Estagiário',
  'Autônomo (RPA)',
  'Pró-labore',
  'PJ',
  'Doméstico',
];

const competenciaAtual = new Date().toISOString().slice(0, 7);

// CPP patronal recolhida à parte (20%+RAT+terceiros) fora do Simples/MEI.
function cppForaDoDAS(regime: string): boolean {
  return regime === 'Lucro Presumido' || regime === 'Lucro Real';
}

const VARIAVEIS_ZERO: VariaveisMes = {
  horasExtras50: 0,
  horasExtras100: 0,
  horasNoturnas: 0,
  faltasEmDias: 0,
  outrosProventos: 0,
  outrosDescontos: 0,
};

export function Folha() {
  const { empresas, funcionarios, adicionarFuncionario, atualizarFuncionario, removerFuncionario } =
    useStore();
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '');
  const [aba, setAba] = useState<'equipe' | 'folha'>('equipe');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);

  const empresa = empresas.find((e) => e.id === empresaId);
  const equipe = useMemo(
    () => funcionarios.filter((f) => f.empresaId === empresaId),
    [funcionarios, empresaId],
  );

  function abrirNovo() {
    setEditando(null);
    setModal(true);
  }
  function abrirEdicao(f: Funcionario) {
    setEditando(f);
    setModal(true);
  }

  if (empresas.length === 0) {
    return (
      <div>
        <PageHeader titulo="Folha / Departamento Pessoal" />
        <EmptyState
          icone={<Users size={40} />}
          titulo="Nenhum cliente cadastrado"
          descricao="Cadastre um cliente para registrar a equipe e processar a folha."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Folha / Departamento Pessoal"
        descricao="Equipe por modalidade de contratação e apuração da folha com memória de cálculo."
        acoes={
          aba === 'equipe' && (
            <Button icon={<Plus size={18} />} onClick={abrirNovo}>
              Novo cadastro
            </Button>
          )
        }
      />

      <div className="mb-5 max-w-sm">
        <Select label="Cliente" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia || e.razaoSocial}
            </option>
          ))}
        </Select>
      </div>

      {/* Abas */}
      <div className="mb-5 flex gap-1 border-b border-graphite-200">
        {(
          [
            ['equipe', 'Equipe'],
            ['folha', 'Folha mensal'],
          ] as [typeof aba, string][]
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

      {aba === 'equipe' ? (
        equipe.length === 0 ? (
          <EmptyState
            icone={<Users size={40} />}
            titulo="Sem colaboradores"
            descricao="Cadastre o primeiro colaborador ou prestador deste cliente."
            acao={
              <Button icon={<Plus size={18} />} onClick={abrirNovo}>
                Novo cadastro
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                    <th className="px-5 py-3 font-semibold">Nome</th>
                    <th className="px-5 py-3 font-semibold">Modalidade</th>
                    <th className="px-5 py-3 font-semibold">Cargo</th>
                    <th className="px-5 py-3 text-right font-semibold">Salário / Valor</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100">
                  {equipe.map((f) => (
                    <tr key={f.id} className="hover:bg-graphite-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-graphite-900">{f.nome}</p>
                        <p className="text-xs text-graphite-400">{f.cpf ? formatCPF(f.cpf) : '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={MODALIDADES_FOLHA.includes(f.modalidade) ? 'blue' : 'gray'}>
                          {f.modalidade}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-graphite-600">{f.cargo || '—'}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-graphite-900">
                        {formatBRL(f.salario)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEdicao(f)}
                            className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
                            aria-label="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remover ${f.nome}?`)) removerFuncionario(f.id);
                            }}
                            className="rounded-lg p-1.5 text-graphite-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        <FolhaMensal equipe={equipe} regime={empresa?.regime ?? 'Simples Nacional'} />
      )}

      {modal && (
        <CadastroFuncionario
          empresaId={empresaId}
          funcionario={editando}
          onFechar={() => setModal(false)}
          onSalvar={(f) => {
            if (editando) atualizarFuncionario(editando.id, f);
            else adicionarFuncionario({ ...f, id: `fu-${Date.now()}` });
            setModal(false);
          }}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------- Cadastro
function CadastroFuncionario({
  empresaId,
  funcionario,
  onFechar,
  onSalvar,
}: {
  empresaId: string;
  funcionario: Funcionario | null;
  onFechar: () => void;
  onSalvar: (f: Funcionario) => void;
}) {
  const [form, setForm] = useState<Funcionario>(
    funcionario ?? {
      id: '',
      empresaId,
      nome: '',
      cpf: '',
      modalidade: 'CLT',
      cargo: '',
      dataAdmissao: new Date().toISOString().slice(0, 10),
      salario: 0,
      dependentes: 0,
      insalubridadeGrau: '',
      periculosidade: false,
      valeTransporte: false,
      ativo: true,
      observacoes: '',
    },
  );
  const [erro, setErro] = useState('');

  const set = <K extends keyof Funcionario>(k: K, v: Funcionario[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const ehFolha = MODALIDADES_FOLHA.includes(form.modalidade);
  const ehEstagio = form.modalidade === 'Estagiário';
  const ehPJ = form.modalidade === 'PJ';

  const rotuloValor = ehEstagio
    ? 'Bolsa-auxílio (R$)'
    : ehFolha
      ? 'Salário base (R$)'
      : 'Valor do serviço / pró-labore (R$)';

  function salvar() {
    if (!form.nome.trim()) return setErro('Informe o nome.');
    if (!ehPJ && form.salario <= 0) return setErro('Informe o valor.');
    onSalvar({ ...form, empresaId });
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={funcionario ? 'Editar cadastro' : 'Novo cadastro'}
      largura="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Seletor de modalidade — comanda as regras */}
        <Select
          label="Modalidade de contratação"
          value={form.modalidade}
          onChange={(e) => set('modalidade', e.target.value as Modalidade)}
        >
          {MODALIDADES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        {ehPJ && (
          <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              PJ não entra na folha: é um <strong>prestador</strong>. O pagamento e as
              retenções (ISS, IRRF, INSS, CSLL/PIS/COFINS) são tratados no módulo Fiscal.
              Aqui fica só o registro do contrato.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nome completo" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
          <Input
            label="CPF"
            value={form.cpf}
            onChange={(e) => set('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="só números"
          />
          <Input label="Cargo / função" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} />
          <Input
            label="Data de admissão / início"
            type="date"
            value={form.dataAdmissao}
            onChange={(e) => set('dataAdmissao', e.target.value)}
          />
          <MoedaInput label={rotuloValor} valor={form.salario} onValor={(n) => set('salario', n)} />
          {ehFolha && (
            <Input
              label="Dependentes (IRRF)"
              type="number"
              min={0}
              value={String(form.dependentes)}
              onChange={(e) => set('dependentes', Math.max(0, Number(e.target.value) || 0))}
            />
          )}
        </div>

        {/* Adicionais — só para modalidades de folha */}
        {ehFolha && (
          <div className="rounded-lg border border-graphite-200 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-400">
              Adicionais (padrão CLT, ajustável por convenção coletiva)
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Insalubridade"
                value={form.insalubridadeGrau}
                onChange={(e) =>
                  set('insalubridadeGrau', e.target.value as Funcionario['insalubridadeGrau'])
                }
                disabled={form.periculosidade}
              >
                <option value="">Não há</option>
                <option value="minimo">Grau mínimo (10%)</option>
                <option value="medio">Grau médio (20%)</option>
                <option value="maximo">Grau máximo (40%)</option>
              </Select>
              <div className="flex flex-col justify-center gap-2 pt-5">
                <label className="flex items-center gap-2 text-sm text-graphite-700">
                  <input
                    type="checkbox"
                    checked={form.periculosidade}
                    onChange={(e) => set('periculosidade', e.target.checked)}
                    className="h-4 w-4 rounded border-graphite-300 text-gold-600 focus:ring-gold-400"
                  />
                  Periculosidade (30%)
                </label>
                <label className="flex items-center gap-2 text-sm text-graphite-700">
                  <input
                    type="checkbox"
                    checked={form.valeTransporte}
                    onChange={(e) => set('valeTransporte', e.target.checked)}
                    className="h-4 w-4 rounded border-graphite-300 text-gold-600 focus:ring-gold-400"
                  />
                  Desconta vale-transporte (até 6%)
                </label>
              </div>
            </div>
            {form.periculosidade && form.insalubridadeGrau && (
              <p className="mt-2 text-xs text-amber-600">
                Periculosidade e insalubridade não se acumulam — será considerada a periculosidade.
              </p>
            )}
          </div>
        )}

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}

// --------------------------------------------------------------- Folha mensal
function FolhaMensal({ equipe, regime }: { equipe: Funcionario[]; regime: string }) {
  const [funcId, setFuncId] = useState(equipe[0]?.id ?? '');
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [v, setV] = useState<VariaveisMes>(VARIAVEIS_ZERO);

  const func = equipe.find((f) => f.id === funcId);
  const podeFolha = func && MODALIDADES_FOLHA.includes(func.modalidade);

  const resultado = useMemo(() => {
    if (!func || !podeFolha) return null;
    return calcularFolhaCLT(func, v, competencia, {
      cppForaDoDAS: cppForaDoDAS(regime),
      fgtsAprendiz: func.modalidade === 'Aprendiz',
    });
  }, [func, podeFolha, v, competencia, regime]);

  if (equipe.length === 0) {
    return (
      <EmptyState
        icone={<Wallet size={40} />}
        titulo="Sem colaboradores"
        descricao="Cadastre a equipe na aba anterior para processar a folha."
      />
    );
  }

  const setV2 = <K extends keyof VariaveisMes>(k: K, val: VariaveisMes[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Entradas */}
      <Card className="space-y-4 p-5 lg:col-span-2">
        <Select label="Colaborador" value={funcId} onChange={(e) => setFuncId(e.target.value)}>
          {equipe.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome} · {f.modalidade}
            </option>
          ))}
        </Select>
        <Input
          label="Competência"
          type="month"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
        />

        {podeFolha ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite-400">
              Variáveis do mês
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Horas extras 50%"
                type="number"
                min={0}
                value={String(v.horasExtras50)}
                onChange={(e) => setV2('horasExtras50', Math.max(0, Number(e.target.value) || 0))}
              />
              <Input
                label="Horas extras 100%"
                type="number"
                min={0}
                value={String(v.horasExtras100)}
                onChange={(e) => setV2('horasExtras100', Math.max(0, Number(e.target.value) || 0))}
              />
              <Input
                label="Horas noturnas"
                type="number"
                min={0}
                value={String(v.horasNoturnas)}
                onChange={(e) => setV2('horasNoturnas', Math.max(0, Number(e.target.value) || 0))}
              />
              <Input
                label="Faltas (dias)"
                type="number"
                min={0}
                value={String(v.faltasEmDias)}
                onChange={(e) => setV2('faltasEmDias', Math.max(0, Number(e.target.value) || 0))}
              />
              <MoedaInput
                label="Outros proventos"
                valor={v.outrosProventos}
                onValor={(n) => setV2('outrosProventos', n)}
              />
              <MoedaInput
                label="Outros descontos"
                valor={v.outrosDescontos}
                onValor={(n) => setV2('outrosDescontos', n)}
              />
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              A modalidade <strong>{func?.modalidade}</strong> não é processada como folha CLT.
              {func?.modalidade === 'PJ'
                ? ' Trate como prestador no módulo Fiscal (retenções).'
                : ' O cálculo desta modalidade entra na próxima fase do módulo.'}
            </span>
          </div>
        )}
      </Card>

      {/* Resultado */}
      <div className="space-y-4 lg:col-span-3">
        {resultado ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="p-5">
                <p className="text-sm text-graphite-500">Proventos</p>
                <p className="mt-1 text-2xl font-bold text-graphite-900">
                  {formatBRL(resultado.totalProventos)}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-graphite-500">Descontos</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {formatBRL(resultado.totalDescontos)}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-graphite-500">Líquido a receber</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {formatBRL(resultado.liquido)}
                </p>
              </Card>
            </div>

            {resultado.avisos.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{a}</span>
              </div>
            ))}

            <SecaoItens titulo="Proventos" itens={resultado.proventos} tom="emerald" />
            <SecaoItens titulo="Descontos" itens={resultado.descontos} tom="red" />
            <SecaoItens
              titulo={`Encargos do empregador — ${formatBRL(resultado.totalEncargos)}`}
              itens={resultado.encargosEmpregador}
              tom="graphite"
            />

            <p className="flex items-center gap-2 rounded-lg bg-graphite-50 px-4 py-3 text-xs text-graphite-500">
              <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
              Valores apurados pelas tabelas oficiais. O IRRF de 2026 usa o novo redutor (Lei
              15.270/2025) — confira contra a tabela oficial antes do fechamento.
            </p>
          </>
        ) : (
          <EmptyState
            icone={<Calculator size={40} />}
            titulo="Selecione um colaborador de folha"
            descricao="A folha aparece aqui com proventos, descontos, líquido e a memória de cálculo."
          />
        )}
      </div>
    </div>
  );
}

function SecaoItens({
  titulo,
  itens,
  tom,
}: {
  titulo: string;
  itens: ItemFolha[];
  tom: 'emerald' | 'red' | 'graphite';
}) {
  if (itens.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-400">
        {titulo}
      </p>
      <div className="space-y-2">
        {itens.map((item, i) => (
          <ItemCard key={i} item={item} tom={tom} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, tom }: { item: ItemFolha; tom: 'emerald' | 'red' | 'graphite' }) {
  const [aberto, setAberto] = useState(false);
  const cor = tom === 'emerald' ? 'text-emerald-700' : tom === 'red' ? 'text-red-600' : 'text-graphite-900';
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setAberto((x) => !x)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-graphite-50/60"
      >
        <span className="flex items-center gap-2 text-sm text-graphite-700">
          <span className="text-graphite-400">
            {aberto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          {item.rotulo}
        </span>
        <span className={cx('font-semibold tabular-nums', cor)}>{formatBRL(item.valor)}</span>
      </button>
      {aberto && item.memoria.length > 0 && (
        <dl className="border-t border-graphite-100 bg-graphite-50/40 px-5 py-3 text-sm">
          {item.memoria.map((p, i) => (
            <div
              key={i}
              className={cx(
                'flex items-center justify-between gap-4 py-0.5',
                p.destaque && 'mt-1 border-t border-graphite-200 pt-2 font-semibold text-graphite-900',
              )}
            >
              <dt className="text-graphite-600">{p.rotulo}</dt>
              <dd className="tabular-nums text-graphite-800">{formatPasso(p)}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

function formatPasso(p: PassoCalculo): string {
  if (p.texto != null) return p.texto;
  if (p.valor == null) return '';
  if (p.tipo === 'percentual') return formatPercent(p.valor, 2);
  if (p.tipo === 'numero') return formatNumber(p.valor, 2);
  return formatBRL(p.valor);
}
