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

// ----------------------------------------------------------------------------
// Máscaras progressivas (aplicadas enquanto o usuário digita): recebem os
// dígitos já limpos e formatam conforme a quantidade digitada, sem exigir o
// número completo. Usadas pelo componente DocumentoInput.
// ----------------------------------------------------------------------------
/** Só os dígitos de uma string. */
export function apenasDigitos(s: string): string {
  return (s ?? '').replace(/\D/g, '');
}

/** Máscara progressiva de CPF: 000.000.000-00 */
export function mascaraCPF(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += '.' + d.slice(3, 6);
  if (d.length > 6) out += '.' + d.slice(6, 9);
  if (d.length > 9) out += '-' + d.slice(9, 11);
  return out;
}

/** Máscara progressiva de CNPJ: 00.000.000/0000-00 */
export function mascaraCNPJ(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '.' + d.slice(2, 5);
  if (d.length > 5) out += '.' + d.slice(5, 8);
  if (d.length > 8) out += '/' + d.slice(8, 12);
  if (d.length > 12) out += '-' + d.slice(12, 14);
  return out;
}

/** Máscara progressiva de RG: 00.000.000-0 (padrão mais comum, ex.: SSP). */
export function mascaraRG(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 9);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '.' + d.slice(2, 5);
  if (d.length > 5) out += '.' + d.slice(5, 8);
  if (d.length > 8) out += '-' + d.slice(8, 9);
  return out;
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

/** Nome amigável derivado do e-mail (ex.: kelly.picossi@x → "Kelly Picossi"). */
export function nomeDoEmail(email: string): string {
  const local = (email.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  if (!local) return email;
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Iniciais a partir de um nome completo. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
