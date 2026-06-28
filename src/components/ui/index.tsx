// Biblioteca de componentes de interface do Trudon ERP.
// Primitivos coesos, no estilo dourado + grafite da marca.
import {
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
} from 'react';
import { X } from 'lucide-react';

type ClassValue = string | false | null | undefined;
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- Card
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('card', className)}>{children}</div>;
}

// ---------------------------------------------------------------- Button
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary:
    'bg-graphite-900 text-white hover:bg-graphite-800 focus-visible:ring-graphite-900/30',
  secondary:
    'border border-graphite-300 bg-white text-graphite-700 hover:bg-graphite-50 focus-visible:ring-graphite-300/40',
  ghost: 'text-graphite-600 hover:bg-graphite-100 focus-visible:ring-graphite-300/40',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold',
        'transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Badge
type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'gold';

const tones: Record<Tone, string> = {
  gray: 'bg-graphite-100 text-graphite-600 ring-graphite-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  gold: 'bg-gold-50 text-gold-800 ring-gold-200',
};

export function Badge({
  tone = 'gray',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Input / Select
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input id={id} className="input" {...props} />
    </div>
  );
}

// ---------------------------------------------------------------- MoedaInput
// Campo monetário com máscara automática (pt-BR): os dígitos digitados são
// tratados como centavos e formatados em tempo real (1.234,56), com prefixo R$.
// Trabalha com `valor` numérico (em reais), não com texto.
function formatMoedaDisplay(v: number): string {
  if (!v) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

interface MoedaInputProps {
  label?: string;
  id?: string;
  valor: number;
  onValor: (n: number) => void;
  placeholder?: string;
  className?: string;
}
export function MoedaInput({
  label,
  id,
  valor,
  onValor,
  placeholder = '0,00',
  className,
}: MoedaInputProps) {
  function aoDigitar(e: ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '');
    onValor(digitos ? Number(digitos) / 100 : 0);
  }
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-graphite-400">
          R$
        </span>
        <input
          id={id}
          className="input pl-9 text-right tabular-nums"
          inputMode="numeric"
          value={formatMoedaDisplay(valor)}
          onChange={aoDigitar}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- DocumentoInput
// Campo de documento (CPF, CNPJ ou RG) com máscara automática: o usuário digita
// só os números e os pontos/traço/barra aparecem no padrão brasileiro.
// Trabalha com `valor` = apenas dígitos (o que fica salvo no modelo).
import { apenasDigitos, mascaraCPF, mascaraCNPJ, mascaraRG } from '@/lib/format';

type TipoDoc = 'cpf' | 'cnpj' | 'rg';
const MASCARA_DOC: Record<TipoDoc, (v: string) => string> = {
  cpf: mascaraCPF,
  cnpj: mascaraCNPJ,
  rg: mascaraRG,
};
const MAX_DIGITOS: Record<TipoDoc, number> = { cpf: 11, cnpj: 14, rg: 9 };
const PLACEHOLDER_DOC: Record<TipoDoc, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  rg: '00.000.000-0',
};

interface DocumentoInputProps {
  label?: string;
  id?: string;
  tipo: TipoDoc;
  valor: string;
  onValor: (digitos: string) => void;
  placeholder?: string;
  className?: string;
}
export function DocumentoInput({
  label,
  id,
  tipo,
  valor,
  onValor,
  placeholder,
  className,
}: DocumentoInputProps) {
  function aoDigitar(e: ChangeEvent<HTMLInputElement>) {
    onValor(apenasDigitos(e.target.value).slice(0, MAX_DIGITOS[tipo]));
  }
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input
        id={id}
        className="input tabular-nums"
        inputMode="numeric"
        value={MASCARA_DOC[tipo](valor)}
        onChange={aoDigitar}
        placeholder={placeholder ?? PLACEHOLDER_DOC[tipo]}
      />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}
export function Select({ label, id, className, children, ...props }: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <select id={id} className="input" {...props}>
        {children}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------- PageHeader
export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-graphite-900">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 text-sm text-graphite-500">{descricao}</p>
        )}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Modal
export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
  largura = 'max-w-lg',
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-graphite-950/50 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className={cx('w-full animate-fade-in', largura)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl bg-white shadow-card-hover">
          <div className="flex items-center justify-between border-b border-graphite-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-graphite-900">{titulo}</h2>
            <button
              onClick={onFechar}
              className="rounded-lg p-1 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-600"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- EmptyState
export function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-graphite-300 bg-white px-6 py-14 text-center">
      {icone && <div className="mb-3 text-graphite-300">{icone}</div>}
      <p className="font-semibold text-graphite-700">{titulo}</p>
      {descricao && (
        <p className="mt-1 max-w-sm text-sm text-graphite-500">{descricao}</p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}
