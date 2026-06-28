import { useMemo, useState } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Eye, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
} from '@/components/ui';
import { useStore } from '@/store/useStore';
import { usuarios } from '@/data/seed';
import type {
  Empresa,
  RegimeTributario,
  SituacaoEmpresa,
  Socio,
} from '@/data/types';
import {
  formatCNPJ,
  formatCPF,
  formatCEP,
  formatDate,
  formatEndereco,
} from '@/lib/format';
import { tomRegime, tomSituacao } from '@/lib/labels';
import {
  inserirEmpresa,
  atualizarEmpresaApi,
  removerEmpresaApi,
} from '@/lib/empresasApi';

const REGIMES: RegimeTributario[] = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI',
];
const SITUACOES: SituacaoEmpresa[] = ['Ativa', 'Suspensa', 'Baixada'];

function formVazio(): Omit<Empresa, 'id' | 'socios'> {
  return {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    regime: 'Simples Nacional',
    situacao: 'Ativa',
    segmento: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    aberturaEm: new Date().toISOString().slice(0, 10),
    email: '',
    telefone: '',
    responsavelId: usuarios[0].id,
  };
}

export function Empresas() {
  const { empresas, adicionarEmpresa, atualizarEmpresa, removerEmpresa } =
    useStore();
  const [busca, setBusca] = useState('');
  const [filtroRegime, setFiltroRegime] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [detalhe, setDetalhe] = useState<Empresa | null>(null);
  const [form, setForm] = useState(formVazio());
  const [socios, setSocios] = useState<Socio[]>([]);
  const [erro, setErro] = useState('');

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return empresas.filter((e) => {
      const casaBusca =
        !q ||
        e.razaoSocial.toLowerCase().includes(q) ||
        e.nomeFantasia.toLowerCase().includes(q) ||
        e.cnpj.includes(q.replace(/\D/g, ''));
      const casaRegime = !filtroRegime || e.regime === filtroRegime;
      return casaBusca && casaRegime;
    });
  }, [empresas, busca, filtroRegime]);

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setSocios([]);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(e: Empresa) {
    setEditando(e);
    const { id: _id, socios: socs, ...resto } = e;
    setForm(resto);
    setSocios(socs.map((s) => ({ ...s })));
    setErro('');
    setModalAberto(true);
  }

  // -- Sócios (no formulário) -------------------------------------------------
  const totalParticipacao = socios.reduce(
    (acc, s) => acc + (Number(s.participacao) || 0),
    0,
  );
  const addSocio = () =>
    setSocios([...socios, { nome: '', cpf: '', participacao: 0 }]);
  const updateSocio = (i: number, patch: Partial<Socio>) =>
    setSocios(socios.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSocio = (i: number) =>
    setSocios(socios.filter((_, idx) => idx !== i));

  async function salvar() {
    if (!form.razaoSocial.trim() || !form.nomeFantasia.trim()) {
      setErro('Razão social e nome fantasia são obrigatórios.');
      return;
    }
    const digitosCnpj = form.cnpj.replace(/\D/g, '');
    if (digitosCnpj.length !== 14) {
      setErro('O CNPJ deve ter 14 dígitos.');
      return;
    }
    // Sócios válidos (com nome) e CPF só dígitos.
    const sociosLimpos: Socio[] = socios
      .filter((s) => s.nome.trim())
      .map((s) => ({
        nome: s.nome.trim(),
        cpf: s.cpf.replace(/\D/g, ''),
        participacao: Number(s.participacao) || 0,
      }));
    if (sociosLimpos.length && Math.round(totalParticipacao) !== 100) {
      setErro(
        `A soma da participação dos sócios é ${totalParticipacao}% — deve fechar 100%.`,
      );
      return;
    }

    const empresa: Empresa = editando
      ? { ...editando, ...form, cnpj: digitosCnpj, socios: sociosLimpos }
      : {
          ...form,
          cnpj: digitosCnpj,
          id: `e-${Date.now()}`,
          socios: sociosLimpos,
        };

    // Persiste no banco; se indisponível, segue em modo local.
    try {
      if (editando) await atualizarEmpresaApi(empresa);
      else await inserirEmpresa(empresa);
    } catch (e) {
      console.warn('Empresa salva apenas localmente (banco indisponível).', e);
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

  return (
    <div>
      <PageHeader
        titulo="Empresas"
        descricao="Carteira de clientes do escritório."
        acoes={
          <Button icon={<Plus size={18} />} onClick={abrirNovo}>
            Nova empresa
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
            placeholder="Buscar por nome ou CNPJ…"
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
          titulo="Nenhuma empresa encontrada"
          descricao="Ajuste os filtros ou cadastre uma nova empresa-cliente."
          acao={
            <Button icon={<Plus size={18} />} onClick={abrirNovo}>
              Nova empresa
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50 text-left text-xs uppercase tracking-wide text-graphite-500">
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">CNPJ</th>
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
                        {e.nomeFantasia}
                      </p>
                      <p className="text-xs text-graphite-500">
                        {e.cidade}/{e.uf} · {e.segmento}
                      </p>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-graphite-600">
                      {formatCNPJ(e.cnpj)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={tomRegime(e.regime)}>{e.regime}</Badge>
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
        titulo={editando ? 'Editar empresa' : 'Nova empresa'}
        largura="max-w-2xl"
      >
        {/* Dados cadastrais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Razão social"
            value={form.razaoSocial}
            onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
          />
          <Input
            label="Nome fantasia"
            value={form.nomeFantasia}
            onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
          />
          <Input
            label="CNPJ"
            value={form.cnpj}
            maxLength={18}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
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
          <Input
            label="Segmento"
            value={form.segmento}
            onChange={(e) => setForm({ ...form, segmento: e.target.value })}
          />
          <Input
            label="Data de abertura"
            type="date"
            value={form.aberturaEm}
            onChange={(e) => setForm({ ...form, aberturaEm: e.target.value })}
          />
        </div>

        {/* Endereço */}
        <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
          Endereço
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Input
            className="sm:col-span-2"
            label="CEP"
            value={form.cep}
            maxLength={9}
            placeholder="00000-000"
            onChange={(e) => setForm({ ...form, cep: e.target.value })}
          />
          <Input
            className="sm:col-span-4"
            label="Logradouro"
            value={form.logradouro}
            placeholder="Rua, avenida, rodovia…"
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

        {/* Contato e responsável */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <Select
            className="sm:col-span-2"
            label="Responsável"
            value={form.responsavelId}
            onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
          >
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </Select>
        </div>

        {/* Sócios */}
        <div className="mt-6 mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
            Sócios
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
              <Input
                className="w-40"
                label={i === 0 ? 'CPF' : undefined}
                value={s.cpf}
                maxLength={14}
                placeholder="000.000.000-00"
                onChange={(e) => updateSocio(i, { cpf: e.target.value })}
              />
              <Input
                className="w-24"
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
        titulo={detalhe?.nomeFantasia ?? ''}
        largura="max-w-xl"
      >
        {detalhe && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <Info rotulo="Razão social" valor={detalhe.razaoSocial} />
              <Info rotulo="CNPJ" valor={formatCNPJ(detalhe.cnpj)} />
              <Info rotulo="Regime" valor={detalhe.regime} />
              <Info rotulo="Situação" valor={detalhe.situacao} />
              <Info rotulo="Segmento" valor={detalhe.segmento} />
              <Info rotulo="Abertura" valor={formatDate(detalhe.aberturaEm)} />
              <Info
                rotulo="Responsável"
                valor={responsavel(detalhe.responsavelId)}
              />
              <Info rotulo="CEP" valor={detalhe.cep ? formatCEP(detalhe.cep) : '—'} />
              <Info rotulo="E-mail" valor={detalhe.email} />
              <Info rotulo="Telefone" valor={detalhe.telefone} />
            </div>
            <div>
              <p className="label">Endereço</p>
              <p className="text-graphite-800">{formatEndereco(detalhe)}</p>
            </div>
            <div>
              <p className="label">Sócios</p>
              {detalhe.socios.length === 0 ? (
                <p className="text-graphite-500">Nenhum sócio cadastrado.</p>
              ) : (
                <ul className="divide-y divide-graphite-100 rounded-lg border border-graphite-200">
                  {detalhe.socios.map((s) => (
                    <li
                      key={s.cpf}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="text-graphite-700">
                        {s.nome}{' '}
                        <span className="text-graphite-400">
                          · {formatCPF(s.cpf)}
                        </span>
                      </span>
                      <Badge tone="gold">{s.participacao}%</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
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
