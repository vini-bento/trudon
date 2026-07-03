import { useMemo, useState } from 'react';
import {
  FolderLock,
  FileText,
  Download,
  ShieldCheck,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, Select } from '@/components/ui';
import { useStore } from '@/store/useStore';
import {
  formatCNPJ,
  formatDateTime,
  formatTamanho,
} from '@/lib/format';

export function Portal() {
  const { empresas, documentos, marcarDocumentoVisualizado } = useStore();
  const elegiveis = empresas.filter((e) => e.situacao !== 'Baixada');
  const [empresaId, setEmpresaId] = useState(elegiveis[0]?.id ?? '');

  const empresa = empresas.find((e) => e.id === empresaId);
  const docs = useMemo(
    () =>
      documentos
        .filter((d) => d.empresaId === empresaId)
        .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm)),
    [documentos, empresaId],
  );

  const naoVistos = docs.filter((d) => !d.visualizado).length;

  function baixar(id: string, nome: string) {
    marcarDocumentoVisualizado(id);
    // Simulação de download — gera um arquivo de demonstração.
    const conteudo = `Documento de demonstração — ${nome}\nTrudon ERP · ambiente de exemplo`;
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        titulo="Portal do Cliente"
        descricao="Documentos publicados para os clientes, com protocolo eletrônico."
      />

      <div className="mb-5 max-w-sm">
        <Select
          label="Empresa"
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
        >
          {elegiveis.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia}
            </option>
          ))}
        </Select>
      </div>

      {empresa && (
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-graphite-900 px-6 py-5 text-white">
            <div>
              <p className="text-lg font-semibold">{empresa.nomeFantasia}</p>
              <p className="text-sm text-graphite-300">
                {formatCNPJ(empresa.cnpj)} · {empresa.cidade}/{empresa.uf}
              </p>
            </div>
            <div className="flex flex-col gap-1 text-sm text-graphite-300">
              <span className="flex items-center gap-2">
                <Mail size={14} /> {empresa.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} /> {empresa.telefone}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 text-sm text-graphite-600">
            <ShieldCheck size={16} className="text-graphite-400" />
            <span className="tabular-nums">{docs.length}</span> documento(s) publicado(s)
            {naoVistos > 0 && (
              <Badge tone="gold" className="ml-1">
                {naoVistos} não visualizado(s)
              </Badge>
            )}
          </div>
        </Card>
      )}

      {docs.length === 0 ? (
        <EmptyState
          icone={<FolderLock size={40} />}
          titulo="Nenhum documento publicado"
          descricao="Os documentos publicados para esta empresa aparecerão aqui."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <FileText size={20} className="mt-0.5 shrink-0 text-graphite-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-graphite-900">
                    {d.nome}
                  </p>
                  <p className="text-xs text-graphite-500">{d.tipo}</p>
                </div>
                {!d.visualizado && (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500"
                    title="Não visualizado"
                  />
                )}
              </div>

              <dl className="mt-3 space-y-1 text-xs tabular-nums text-graphite-500">
                <div className="flex justify-between">
                  <dt>Protocolo</dt>
                  <dd className="font-mono text-graphite-700">{d.protocolo}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Publicado</dt>
                  <dd>{formatDateTime(d.publicadoEm)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tamanho</dt>
                  <dd>{formatTamanho(d.tamanhoKb)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-graphite-100 pt-3">
                <span className="flex items-center gap-1 text-xs text-graphite-400">
                  <Eye size={13} />
                  {d.visualizado ? 'Visualizado' : 'Novo'}
                </span>
                <button
                  onClick={() => baixar(d.id, d.nome)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-graphite-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-graphite-800"
                >
                  <Download size={14} />
                  Baixar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
