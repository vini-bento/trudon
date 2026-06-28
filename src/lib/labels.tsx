// Mapeamento de status/situação para o tom visual do Badge.
import type {
  SituacaoEmpresa,
  StatusCobranca,
  StatusObrigacao,
  RegimeTributario,
} from '@/data/types';

type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'gold';

export function tomSituacao(s: SituacaoEmpresa): Tone {
  return s === 'Ativa' ? 'green' : s === 'Suspensa' ? 'amber' : 'gray';
}

export function tomCobranca(s: StatusCobranca): Tone {
  return s === 'Pago' ? 'green' : s === 'Pendente' ? 'amber' : 'red';
}

export function tomObrigacao(s: StatusObrigacao): Tone {
  switch (s) {
    case 'Concluída':
      return 'green';
    case 'Em andamento':
      return 'blue';
    case 'Pendente':
      return 'amber';
    case 'Atrasada':
      return 'red';
  }
}

export function tomRegime(r: RegimeTributario): Tone {
  switch (r) {
    case 'Simples Nacional':
      return 'blue';
    case 'Lucro Presumido':
      return 'gold';
    case 'Lucro Real':
      return 'gray';
    case 'MEI':
      return 'green';
  }
}
