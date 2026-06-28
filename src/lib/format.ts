// Utilitários de formatação para o padrão brasileiro (BRL, datas, documentos).
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Formata um número como moeda brasileira (R$ 1.234,56). */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(valor) ? valor : 0);
}

/** Formata um número como valor sem o símbolo (1.234,56). */
export function formatNumber(valor: number, casas = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(Number.isFinite(valor) ? valor : 0);
}

/** Formata um percentual (12,5%). */
export function formatPercent(valor: number, casas = 1): string {
  return `${formatNumber(valor, casas)}%`;
}

/** Aplica máscara de CNPJ: 00.000.000/0000-00 */
export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/** Aplica máscara de CEP: 00000-000 */
export function formatCEP(cep: string): string {
  const d = cep.replace(/\D/g, '').slice(0, 8);
  if (d.length !== 8) return cep;
  return d.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/** Monta o endereço completo numa linha legível. */
export function formatEndereco(e: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}): string {
  const linha1 = [e.logradouro, e.numero].filter(Boolean).join(', ');
  const partes = [
    linha1,
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join('/'),
    e.cep ? `CEP ${formatCEP(e.cep)}` : '',
  ].filter(Boolean);
  return partes.join(' · ') || '—';
}

/** Aplica máscara de CPF: 000.000.000-00 */
export function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '').padStart(11, '0').slice(0, 11);
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

/** Formata data como dd/MM/yyyy. */
export function formatDate(value: string | Date): string {
  const d = toDate(value);
  return d ? format(d, 'dd/MM/yyyy') : '—';
}

/** Formata data e hora como dd/MM/yyyy HH:mm. */
export function formatDateTime(value: string | Date): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy 'às' HH:mm") : '—';
}

/** Converte competência "YYYY-MM" para "mmm/yyyy" (ex.: "2026-06" -> "jun/2026"). */
export function formatCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  if (!ano || !mes) return competencia;
  const d = new Date(ano, mes - 1, 1);
  return format(d, 'MMM/yyyy', { locale: ptBR });
}

/** Texto de competência por extenso (ex.: "Junho de 2026"). */
export function formatCompetenciaLonga(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  if (!ano || !mes) return competencia;
  const d = new Date(ano, mes - 1, 1);
  const txt = format(d, "MMMM 'de' yyyy", { locale: ptBR });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** Tamanho de arquivo legível (KB/MB). */
export function formatTamanho(kb: number): string {
  if (kb < 1024) return `${formatNumber(kb, 0)} KB`;
  return `${formatNumber(kb / 1024, 1)} MB`;
}

/** Iniciais a partir de um nome completo. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
