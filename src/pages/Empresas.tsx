import { useMemo, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DocumentoInput,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  cx,
} from '@/components/ui';
import { useStore } from '@/store/useStore';
import { usuarios } from '@/data/seed';
import { bancos } from '@/data/bancos';
import type {
  Contato,
  Empresa,
  RegimeTributario,
  SituacaoEmpresa,
  Socio,
  TipoPessoa,
} from '@/data/types';
import {
  formatCNPJ,
  formatCPF,
  formatDate,
  formatEndereco,
} from '@/lib/format';
import { tomRegime, tomSituacao } from '@/lib/labels';
import {
  inserirEmpresa,
  atualizarEmpresaApi,
  removerEmpresaApi,
} from '@/lib/empresasApi';
import {
  CATEGORIAS_VINCULO,
  possuiFolhaDePagamento,
  totalVinculos,
  type CategoriaVinculo,
  type VinculoQuantidade,
} from '@/lib/pessoal';
import {
  listarQuadroPessoal,
  salvarQuadroPessoal,
} from '@/lib/quadroPessoalApi';

const REGIMES: RegimeTributario[] = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI',
];
const SITUACOES: SituacaoEmpresa[] = ['Ativa', 'Suspensa', 'Baixada'];
const QUALIFICACOES = [
  'Sócio-administrador',
  'Sócio',
  'Administrador',
  'Titular',
  'Acionista',
];

type FormEmpresa = Omit<Empresa, 'id' | 'socios' | 'contatos'>;

function formVazio(): FormEmpresa {
  return {
    tipoPessoa: 'PJ',
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    isentoIE: false,
    inscricaoMunicipal: '',
    cnae: '',
    naturezaJuridica: '',
    cpf: '',
    rg: '',
    orgaoEmissor: '',
    dataNascimento: '',
    profissao: '',
    regime: 'Simples Nacional',
    situacao: 'Ativa',
    segmento: '',
    aberturaEm: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    certificadoTipo: '',
    certificadoValidade: '',
    ecacValidade: '',
    bancoCodigo: '',
    agencia: '',
    conta: '',
    tipoConta: '',
    pix: '',
    email: '',
    telefone: '',
    responsavelId: usuarios[0].id,
    observacoes: '',
  };
}

const contatoVazio = (): Contato => ({
  nome: '',
  cargo: '',
  email: '',
  telefone: '',
  principal: false,
});

type QuantidadesQuadro = Record<CategoriaVinculo, number>;

const quadroVazio = (): QuantidadesQuadro =>
  Object.fromEntries(
    CATEGORIAS_VINCULO.map((c) => [c.categoria, 0]),
  ) as QuantidadesQuadro;

export function Empresas() {
  const { empresas, adicionarEmpresa, atualizarEmpresa, removerEmpresa } =
    useStore();
  const [busca, setBusca] = useState('');
  const [filtroRegime, setFiltroRegime] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [detalhe, setDetalhe] = useState<Empresa | null>(null);
  const [form, setForm] = useState<FormEmpresa>(formVazio());
  const [socios, setSocios] = useState<Socio[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [quadro, setQuadro] = useState<QuantidadesQuadro>(quadroVazio());
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');

  const isPF = form.tipoPessoa === 'PF';

  // -- Quadro de pessoal ------------------------------------------------------
  const quadroVinculos: VinculoQuantidade[] = CATEGORIAS_VINCULO.map((c) => ({
    categoria: c.categoria,
    quantidade: quadro[c.categoria] || 0,
  }));
  const totalQuadro = totalVinculos(quadroVinculos);
  const temFolha = possuiFolhaDePagamento(quadroVinculos);
  const updateQuadro = (categoria: CategoriaVinculo, valor: number) =>
    setQuadro((q) => ({ ...q, [categoria]: Math.max(0, Math.floor(valor) || 0) }));

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return empresas.filter((e) => {
      const casaBusca =
        !q ||
        e.razaoSocial.toLowerCase().includes(q) ||
        e.nomeFantasia.toLowerCase().includes(q) ||
        e.cnpj.includes(q.replace(/\D/g, '')) ||
        e.cpf.includes(q.replace(/\D/g, ''));
      const casaRegime = !filtroRegime || e.regime === filtroRegime;
      return casaBusca && casaRegime;
    });
  }, [empresas, busca, filtroRegime]);

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setSocios([]);
    setContatos([{ ...contatoVazio(), principal: true }]);
    setQuadro(quadroVazio());
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(e: Empresa) {
    setEditando(e);
    const { id: _id, socios: socs, contatos: cons, ...resto } = e;
    setForm(resto);
    setSocios(socs.map((s) => ({ ...s })));
    setContatos(
      cons.length ? cons.map((c) => ({ ...c })) : [{ ...contatoVazio(), principal: true }],
    );
    // Quadro de pessoal vive em tabela própria: carrega sob demanda. Começa
    // zerado e é preenchido quando o banco responde (offline → permanece zero).
    setQuadro(quadroVazio());
    listarQuadroPessoal(e.id)
      .then((itens) => {
        if (!itens.length) return;
        setQuadro((q) => {
          const novo = { ...q };
          itens.forEach((it) => (novo[it.categoria] = it.quantidade));
          return novo;
        });
      })
      .catch((err) =>
        console.warn('Quadro de pessoal indisponível (banco offline).', err),
      );
    setErro('');
    setModalAberto(true);
  }

  // -- CEP automático (ViaCEP) ------------------------------------------------
  async function buscarCep(cep: string) {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (!j.erro) {
        setForm((f) => ({
          ...f,
          logradouro: j.logradouro || f.logradouro,
          bairro: j.bairro || f.bairro,
          cidade: j.localidade || f.cidade,
          uf: j.uf || f.uf,
        }));
      }
    } catch {
      /* offline / indisponível — ignora, usuário preenche manualmente */
    }
    setBuscandoCep(false);
  }

  // -- Sócios -----------------------------------------------------------------
  const totalParticipacao = socios.reduce(
    (acc, s) => acc + (Number(s.participacao) || 0),
    0,
  );
  const addSocio = () =>
    setSocios([...socios, { nome: '', cpf: '', participacao: 0, qualificacao: 'Sócio' }]);
  const updateSocio = (i: number, patch: Partial<Socio>) =>
    setSocios(socios.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSocio = (i: number) =>
    setSocios(socios.filter((_, idx) => idx !== i));

  // -- Contatos ---------------------------------------------------------------
  const addContato = () => setContatos([...contatos, contatoVazio()]);
  const updateContato = (i: number, patch: Partial<Contato>) =>
    setContatos(contatos.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeContato = (i: number) =>
    setContatos(contatos.filter((_, idx) => idx !== i));
  const definirPrincipal = (i: number) =>
    setContatos(contatos.map((c, idx) => ({ ...c, principal: idx === i })));

  async function salvar() {
    if (!form.razaoSocial.trim()) {
      setErro(isPF ? 'O nome completo é obrigatório.' : 'A razão social é obrigatória.');
      return;
    }
    let cnpj = '';
    let cpf = '';
    if (isPF) {
      cpf = form.cpf.replace(/\D/g, '');
      if (cpf.length !== 11) {
        setErro('O CPF deve ter 11 dígitos.');
        return;
      }
    } else {
      if (!form.nomeFantasia.trim()) {
        setErro('O nome fantasia é obrigatório.');
        return;
      }
      cnpj = form.cnpj.replace(/\D/g, '');
      if (cnpj.length !== 14) {
        setErro('O CNPJ deve ter 14 dígitos.');
        return;
      }
    }

    const sociosLimpos: Socio[] = isPF
      ? []
      : socios
          .filter((s) => s.nome.trim())
          .map((s) => ({
            nome: s.nome.trim(),
            cpf: s.cpf.replace(/\D/g, ''),
            participacao: Number(s.participacao) || 0,
            qualificacao: s.qualificacao || 'Sócio',
          }));
    if (sociosLimpos.length && Math.round(totalParticipacao) !== 100) {
      setErro(
        `A soma da participação dos sócios é ${totalParticipacao}% — deve fechar 100%.`,
      );
      return;
    }

    let contatosLimpos = contatos.filter((c) => c.nome.trim() || c.email.trim());
    if (contatosLimpos.length && !contatosLimpos.some((c) => c.principal)) {
      contatosLimpos = contatosLimpos.map((c, i) => ({ ...c, principal: i === 0 }));
    }

    const base = {
      ...form,
      nomeFantasia: isPF ? form.razaoSocial.trim() : form.nomeFantasia.trim(),
      cnpj,
      cpf,
      socios: sociosLimpos,
      contatos: contatosLimpos,
    };
    const empresa: Empresa = editando
      ? { ...editando, ...base }
      : { ...base, id: `e-${Date.now()}` };

    try {
      if (editando) await atualizarEmpresaApi(empresa);
      else await inserirEmpresa(empresa);
      // Quadro de pessoal é entidade própria; só se aplica a PJ.
      if (!isPF) await salvarQuadroPessoal(empresa.id, quadro);
    } catch (e) {
      console.warn('Cliente salvo apenas localmente (banco indisponível).', e);
    }

    if (editando) atualizarEmpresa(editando.id, empresa);
    else adicionarEmpresa(empresa);
    setModalAberto(false);
  }

  async function confirmarExclusao(e: Empresa) {
    if (
      !window.confirm(
        `Excluir "${e.nomeFantasia}"? Todos os dados vinculados (lançamentos, honorários, obrigações e documentos) serão removidos.`,
      )
    ) {
      return;
    }
    try {
      await removerEmpresaApi(e.id);
    } catch (err) {
      console.warn('Exclusão aplicada apenas localmente (banco indisponível).', err);
    }
    removerEmpresa(e.id);
  }

  const responsavel = (id: string) =>
    usuarios.find((u) => u.id === id)?.nome ?? '—';
  const documento = (e: Empresa) =>
    e.tipoPessoa === 'PF' ? formatCPF(e.cpf) : formatCNPJ(e.cnpj);

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        descricao="Carteira de clientes do escritório (Pessoa Física e Jurídica)."
        acoes={
          <Button icon={<Plus size={18} />} onClick={abrirNovo}>
            Novo cliente
          </Button>
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou CPF…"
            className="input pl-9"
          />
        </div>
        <select
          value={filtroRegime}
          onChange={(e) => setFiltroRegime(e.target.value)}
          className="input w-auto"
        >
          <option value="">Todos os regimes</option>
          {REGIMES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="text-sm text-graphite-500">
          {filtradas.length} de {empresas.length}
        </span>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icone={<Building2 size={40} />}
          titulo="Nenhum cliente encontrado"
          descricao="Ajuste os filtros ou cadastre um novo cliente."
          acao={
            <Button icon={<Plus size={18} />} onClick={abrirNovo}>
              Novo cliente
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">CNPJ / CPF</th>
                  <th className="px-5 py-3 font-semibold">Regime</th>
                  <th className="px-5 py-3 font-semibold">Responsável</th>
                  <th className="px-5 py-3 font-semibold">Situação</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {filtradas.map((e) => (
                  <tr key={e.id} className="hover:bg-graphite-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-graphite-900">
                        {e.nomeFantasia || e.razaoSocial}
                      </p>
                      <p className="text-xs text-graphite-500">
                        {e.cidade}/{e.uf} · {e.segmento || e.profissao || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-graphite-600">
                      {documento(e)}
                    </td>
                    <td className="px-5 py-3">
                      {e.tipoPessoa === 'PJ' ? (
                        <Badge tone={tomRegime(e.regime)}>{e.regime}</Badge>
                      ) : (
                        <Badge tone="gray">Pessoa Física</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-graphite-600">
                      {responsavel(e.responsavelId)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={tomSituacao(e.situacao)}>{e.situacao}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetalhe(e)}
                          className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
                          aria-label="Ver detalhes"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => abrirEdicao(e)}
                          className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
                          aria-label="Editar"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => confirmarExclusao(e)}
                          className="rounded-lg p-1.5 text-graphite-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Excluir"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de cadastro/edição */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? 'Editar cliente' : 'Novo cliente'}
        largura="max-w-2xl"
      >
        {/* Tipo de pessoa */}
        <div className="mb-5 inline-flex rounded-lg border border-graphite-300 p-1">
          {(['PJ', 'PF'] as TipoPessoa[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, tipoPessoa: t })}
              className={cx(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                form.tipoPessoa === t
                  ? 'bg-graphite-900 text-white'
                  : 'text-graphite-600 hover:bg-graphite-100',
              )}
            >
              {t === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
            </button>
          ))}
        </div>

        {/* Identificação */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label={isPF ? 'Nome completo' : 'Razão social'}
            value={form.razaoSocial}
            onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
          />
          {!isPF && (
            <Input
              label="Nome fantasia"
              value={form.nomeFantasia}
              onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
            />
          )}
          <DocumentoInput
            label={isPF ? 'CPF' : 'CNPJ'}
            tipo={isPF ? 'cpf' : 'cnpj'}
            valor={isPF ? form.cpf : form.cnpj}
            onValor={(d) =>
              setForm(isPF ? { ...form, cpf: d } : { ...form, cnpj: d })
            }
          />

          {/* Campos PJ */}
          {!isPF && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  className="col-span-2"
                  label="Inscrição Estadual"
                  value={form.inscricaoEstadual}
                  disabled={form.isentoIE}
                  onChange={(e) =>
                    setForm({ ...form, inscricaoEstadual: e.target.value })
                  }
                />
                <label className="flex items-end gap-2 pb-2 text-sm text-graphite-600">
                  <input
                    type="checkbox"
                    checked={form.isentoIE}
                    onChange={(e) =>
                      setForm({ ...form, isentoIE: e.target.checked })
                    }
                  />
                  Isento
                </label>
              </div>
              <Input
                label="Inscrição Municipal"
                value={form.inscricaoMunicipal}
                onChange={(e) =>
                  setForm({ ...form, inscricaoMunicipal: e.target.value })
                }
              />
              <Input
                label="CNAE (atividade principal)"
                value={form.cnae}
                placeholder="0000-0/00"
                onChange={(e) => setForm({ ...form, cnae: e.target.value })}
              />
              <Input
                label="Natureza jurídica"
                value={form.naturezaJuridica}
                onChange={(e) =>
                  setForm({ ...form, naturezaJuridica: e.target.value })
                }
              />
              <Select
                label="Regime tributário"
                value={form.regime}
                onChange={(e) =>
                  setForm({ ...form, regime: e.target.value as RegimeTributario })
                }
              >
                {REGIMES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
              <Input
                label="Data de abertura"
                type="date"
                value={form.aberturaEm}
                onChange={(e) => setForm({ ...form, aberturaEm: e.target.value })}
              />
            </>
          )}

          {/* Campos PF */}
          {isPF && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <DocumentoInput
                  className="col-span-2"
                  label="RG"
                  tipo="rg"
                  valor={form.rg}
                  onValor={(d) => setForm({ ...form, rg: d })}
                />
                <Input
                  label="Órgão"
                  value={form.orgaoEmissor}
                  placeholder="SSP/SP"
                  onChange={(e) =>
                    setForm({ ...form, orgaoEmissor: e.target.value })
                  }
                />
              </div>
              <Input
                label="Data de nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={(e) =>
                  setForm({ ...form, dataNascimento: e.target.value })
                }
              />
              <Input
                label="Profissão / atividade"
                value={form.profissao}
                onChange={(e) => setForm({ ...form, profissao: e.target.value })}
              />
            </>
          )}

          <Input
            label="Segmento / atividade"
            value={form.segmento}
            onChange={(e) => setForm({ ...form, segmento: e.target.value })}
          />
          <Select
            label="Situação"
            value={form.situacao}
            onChange={(e) =>
              setForm({ ...form, situacao: e.target.value as SituacaoEmpresa })
            }
          >
            {SITUACOES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>

        {/* Endereço (com CEP automático) */}
        <SecaoTitulo>Endereço</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="cep" className="label">
              CEP {buscandoCep && <Loader2 size={11} className="ml-1 inline animate-spin" />}
            </label>
            <input
              id="cep"
              className="input"
              value={form.cep}
              maxLength={9}
              placeholder="00000-000"
              onChange={(e) => setForm({ ...form, cep: e.target.value })}
              onBlur={(e) => buscarCep(e.target.value)}
            />
          </div>
          <Input
            className="sm:col-span-4"
            label="Logradouro"
            value={form.logradouro}
            placeholder="Preenchido pelo CEP"
            onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
          />
          <Input
            className="sm:col-span-2"
            label="Número"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
          />
          <Input
            className="sm:col-span-4"
            label="Complemento"
            value={form.complemento}
            placeholder="Sala, conjunto, galpão, bloco…"
            onChange={(e) => setForm({ ...form, complemento: e.target.value })}
          />
          <Input
            className="sm:col-span-2"
            label="Bairro"
            value={form.bairro}
            onChange={(e) => setForm({ ...form, bairro: e.target.value })}
          />
          <Input
            className="sm:col-span-3"
            label="Cidade"
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
          />
          <Input
            className="sm:col-span-1"
            label="UF"
            maxLength={2}
            value={form.uf}
            onChange={(e) =>
              setForm({ ...form, uf: e.target.value.toUpperCase() })
            }
          />
        </div>

        {/* Contatos */}
        <SecaoTitulo>Contatos</SecaoTitulo>
        <div className="space-y-3">
          {contatos.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-graphite-200 p-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Nome"
                  value={c.nome}
                  onChange={(e) => updateContato(i, { nome: e.target.value })}
                />
                <Input
                  label="Cargo / função"
                  value={c.cargo}
                  placeholder="Financeiro, Fiscal, Sócio…"
                  onChange={(e) => updateContato(i, { cargo: e.target.value })}
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={c.email}
                  onChange={(e) => updateContato(i, { email: e.target.value })}
                />
                <Input
                  label="Telefone / celular"
                  value={c.telefone}
                  onChange={(e) => updateContato(i, { telefone: e.target.value })}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-graphite-600">
                  <input
                    type="checkbox"
                    checked={c.principal}
                    onChange={() => definirPrincipal(i)}
                  />
                  Contato principal
                </label>
                <button
                  type="button"
                  onClick={() => removeContato(i)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-graphite-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={14} /> Remover
                </button>
              </div>
            </div>
          ))}
          <Button variant="secondary" icon={<Plus size={16} />} onClick={addContato}>
            Adicionar contato
          </Button>
        </div>

        {/* Sócios (apenas PJ) */}
        {!isPF && (
          <>
            <div className="mt-6 mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                Quadro societário
              </p>
              <span
                className={
                  socios.length && Math.round(totalParticipacao) !== 100
                    ? 'text-xs font-medium text-red-600'
                    : 'text-xs text-graphite-500'
                }
              >
                Total: {totalParticipacao}%
              </span>
            </div>
            <div className="space-y-2">
              {socios.map((s, i) => (
                <div key={i} className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    label={i === 0 ? 'Nome' : undefined}
                    value={s.nome}
                    onChange={(e) => updateSocio(i, { nome: e.target.value })}
                  />
                  <DocumentoInput
                    className="w-36"
                    label={i === 0 ? 'CPF' : undefined}
                    tipo="cpf"
                    valor={s.cpf}
                    onValor={(d) => updateSocio(i, { cpf: d })}
                  />
                  <Select
                    className="w-44"
                    label={i === 0 ? 'Qualificação' : undefined}
                    value={s.qualificacao}
                    onChange={(e) =>
                      updateSocio(i, { qualificacao: e.target.value })
                    }
                  >
                    {QUALIFICACOES.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </Select>
                  <Input
                    className="w-20"
                    label={i === 0 ? 'Part. %' : undefined}
                    type="number"
                    value={String(s.participacao)}
                    onChange={(e) =>
                      updateSocio(i, { participacao: Number(e.target.value) })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeSocio(i)}
                    className="mb-1 rounded-lg p-2 text-graphite-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover sócio"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <Button variant="secondary" icon={<Plus size={16} />} onClick={addSocio}>
                Adicionar sócio
              </Button>
            </div>
          </>
        )}

        {/* Quadro de pessoal (apenas PJ) */}
        {!isPF && (
          <>
            <div className="mt-6 mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                Quadro de pessoal
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={temFolha ? 'gold' : 'gray'}>
                  {temFolha ? 'Possui folha de pagamento' : 'Sem folha de pagamento'}
                </Badge>
                <span className="text-xs text-graphite-500">
                  Total: {totalQuadro}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {CATEGORIAS_VINCULO.map((c) => (
                <Input
                  key={c.categoria}
                  label={c.rotulo}
                  type="number"
                  min={0}
                  value={String(quadro[c.categoria])}
                  onChange={(e) => updateQuadro(c.categoria, Number(e.target.value))}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-graphite-400">
              Contagem de vínculos por categoria. Autônomos/RPA (contribuintes
              individuais) não caracterizam folha de pagamento.
            </p>
          </>
        )}

        {/* Dados bancários */}
        <SecaoTitulo>Dados bancários</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Select
            className="sm:col-span-3"
            label="Banco"
            value={form.bancoCodigo}
            onChange={(e) => setForm({ ...form, bancoCodigo: e.target.value })}
          >
            <option value="">Selecione…</option>
            {bancos.map((b) => (
              <option key={b.codigo} value={b.codigo}>
                {b.codigo} — {b.nome}
              </option>
            ))}
          </Select>
          <Input
            className="sm:col-span-1"
            label="Agência"
            value={form.agencia}
            onChange={(e) => setForm({ ...form, agencia: e.target.value })}
          />
          <Input
            className="sm:col-span-2"
            label="Conta"
            value={form.conta}
            onChange={(e) => setForm({ ...form, conta: e.target.value })}
          />
          <Select
            className="sm:col-span-2"
            label="Tipo de conta"
            value={form.tipoConta}
            onChange={(e) =>
              setForm({ ...form, tipoConta: e.target.value as Empresa['tipoConta'] })
            }
          >
            <option value="">—</option>
            <option>Corrente</option>
            <option>Poupança</option>
          </Select>
          <Input
            className="sm:col-span-4"
            label="Chave PIX"
            value={form.pix}
            onChange={(e) => setForm({ ...form, pix: e.target.value })}
          />
        </div>

        {/* Acessos governamentais */}
        <SecaoTitulo>Acessos governamentais</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Certificado digital"
            value={form.certificadoTipo}
            onChange={(e) =>
              setForm({
                ...form,
                certificadoTipo: e.target.value as Empresa['certificadoTipo'],
              })
            }
          >
            <option value="">Não informado</option>
            <option value="A1">A1</option>
            <option value="A3">A3</option>
          </Select>
          <Input
            label="Validade do certificado"
            type="date"
            value={form.certificadoValidade}
            onChange={(e) =>
              setForm({ ...form, certificadoValidade: e.target.value })
            }
          />
          <Input
            label="Validade procuração e-CAC"
            type="date"
            value={form.ecacValidade}
            onChange={(e) => setForm({ ...form, ecacValidade: e.target.value })}
          />
        </div>

        {/* Responsável e observações */}
        <SecaoTitulo>Atendimento</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Responsável (escritório)"
            value={form.responsavelId}
            onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
          >
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </Select>
          <div>
            <label htmlFor="obs" className="label">
              Observações
            </label>
            <textarea
              id="obs"
              className="input min-h-[72px]"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </div>

        {erro && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            {editando ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </div>
      </Modal>

      {/* Modal de detalhes */}
      <Modal
        aberto={!!detalhe}
        onFechar={() => setDetalhe(null)}
        titulo={detalhe?.nomeFantasia || detalhe?.razaoSocial || ''}
        largura="max-w-2xl"
      >
        {detalhe && <Detalhe e={detalhe} responsavel={responsavel} />}
      </Modal>
    </div>
  );
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
      {children}
    </p>
  );
}

function Detalhe({
  e,
  responsavel,
}: {
  e: Empresa;
  responsavel: (id: string) => string;
}) {
  const isPF = e.tipoPessoa === 'PF';
  const banco = bancos.find((b) => b.codigo === e.bancoCodigo);
  return (
    <div className="space-y-4 text-sm">
      <Badge tone={isPF ? 'gray' : 'gold'}>
        {isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}
      </Badge>

      <div className="grid grid-cols-2 gap-4">
        <Info rotulo={isPF ? 'Nome completo' : 'Razão social'} valor={e.razaoSocial} />
        <Info rotulo={isPF ? 'CPF' : 'CNPJ'} valor={isPF ? formatCPF(e.cpf) : formatCNPJ(e.cnpj)} />
        {isPF ? (
          <>
            <Info rotulo="RG" valor={[e.rg, e.orgaoEmissor].filter(Boolean).join(' ')} />
            <Info rotulo="Nascimento" valor={e.dataNascimento ? formatDate(e.dataNascimento) : '—'} />
            <Info rotulo="Profissão" valor={e.profissao} />
          </>
        ) : (
          <>
            <Info rotulo="Inscrição Estadual" valor={e.isentoIE ? 'Isento' : e.inscricaoEstadual} />
            <Info rotulo="Inscrição Municipal" valor={e.inscricaoMunicipal} />
            <Info rotulo="CNAE" valor={e.cnae} />
            <Info rotulo="Natureza jurídica" valor={e.naturezaJuridica} />
            <Info rotulo="Regime" valor={e.regime} />
            <Info rotulo="Abertura" valor={e.aberturaEm ? formatDate(e.aberturaEm) : '—'} />
          </>
        )}
        <Info rotulo="Situação" valor={e.situacao} />
        <Info rotulo="Segmento" valor={e.segmento} />
        <Info rotulo="Responsável" valor={responsavel(e.responsavelId)} />
      </div>

      <div>
        <p className="label">Endereço</p>
        <p className="text-graphite-800">{formatEndereco(e)}</p>
      </div>

      <div>
        <p className="label">Contatos</p>
        {e.contatos.length === 0 ? (
          <p className="text-graphite-500">Nenhum contato cadastrado.</p>
        ) : (
          <ul className="divide-y divide-graphite-100 rounded-lg border border-graphite-200">
            {e.contatos.map((c, i) => (
              <li key={i} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-graphite-800">
                    {c.nome}{' '}
                    {c.cargo && (
                      <span className="font-normal text-graphite-400">· {c.cargo}</span>
                    )}
                  </span>
                  {c.principal && <Badge tone="green">Principal</Badge>}
                </div>
                <p className="text-xs text-graphite-500">
                  {[c.email, c.telefone].filter(Boolean).join(' · ') || '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isPF && (
        <div>
          <p className="label">Sócios</p>
          {e.socios.length === 0 ? (
            <p className="text-graphite-500">Nenhum sócio cadastrado.</p>
          ) : (
            <ul className="divide-y divide-graphite-100 rounded-lg border border-graphite-200">
              {e.socios.map((s) => (
                <li key={s.cpf} className="flex items-center justify-between px-3 py-2">
                  <span className="text-graphite-700">
                    {s.nome}{' '}
                    <span className="text-graphite-400">
                      · {formatCPF(s.cpf)}
                      {s.qualificacao ? ` · ${s.qualificacao}` : ''}
                    </span>
                  </span>
                  <Badge tone="gold">{s.participacao}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Info
          rotulo="Banco"
          valor={banco ? `${banco.codigo} — ${banco.nome}` : '—'}
        />
        <Info
          rotulo="Agência / Conta"
          valor={
            e.agencia || e.conta
              ? `${e.agencia || '—'} / ${e.conta || '—'}${e.tipoConta ? ` (${e.tipoConta})` : ''}`
              : '—'
          }
        />
        <Info rotulo="PIX" valor={e.pix} />
        <Info
          rotulo="Certificado digital"
          valor={
            e.certificadoTipo
              ? `${e.certificadoTipo}${e.certificadoValidade ? ` · val. ${formatDate(e.certificadoValidade)}` : ''}`
              : '—'
          }
        />
        <Info
          rotulo="Procuração e-CAC"
          valor={e.ecacValidade ? `val. ${formatDate(e.ecacValidade)}` : '—'}
        />
      </div>

      {e.observacoes && (
        <div>
          <p className="label">Observações</p>
          <p className="whitespace-pre-wrap text-graphite-800">{e.observacoes}</p>
        </div>
      )}
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="label">{rotulo}</p>
      <p className="text-graphite-800">{valor || '—'}</p>
    </div>
  );
}
