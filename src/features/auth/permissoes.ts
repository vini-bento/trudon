// ============================================================================
// Permissões da interface (blindagem por papel).
// ----------------------------------------------------------------------------
// A REGRA REAL DE SEGURANÇA é o RLS no Supabase (servidor) — isto aqui é a
// camada de interface: esconder o que o usuário não pode acessar e impedir a
// navegação. Falha segura: na dúvida, NEGA.
//
// Modelo:
//   • dono (Vinícius, Kelly)  → acesso total.
//   • equipe                  → Dashboard sempre; demais áreas conforme as
//                               permissões concedidas pelos donos. Configurações
//                               (gestão de equipe) é só de dono.
//   • cliente                 → apenas o Portal (seus próprios documentos).
// ============================================================================
import type { UsuarioLogado } from '@/features/ia/useAuth';

export type Area =
  | 'dashboard'
  | 'empresas'
  | 'contabilidade'
  | 'fiscal'
  | 'folha'
  | 'honorarios'
  | 'obrigacoes'
  | 'portal'
  | 'config';

// Permissão (chave) exigida de um membro da equipe para cada área.
// null = liberado para toda a equipe. Donos ignoram; cliente tem regra à parte.
const PERMISSAO_DA_AREA: Record<Area, string | null> = {
  dashboard: null,
  empresas: 'empresas',
  contabilidade: 'contabilidade',
  fiscal: 'fiscal',
  folha: 'folha',
  honorarios: 'honorarios',
  obrigacoes: 'obrigacoes',
  portal: 'portal',
  config: null, // só dono (tratado abaixo)
};

export function podeAcessar(area: Area, u: UsuarioLogado | null): boolean {
  if (!u) return false;
  // Cliente: só o próprio Portal.
  if (u.papel === 'cliente') return area === 'portal';
  // Dono: acesso total.
  if (u.dono) return true;
  // Equipe (não-dono):
  if (area === 'config') return false; // gestão de equipe é só de dono
  if (area === 'dashboard') return true;
  const req = PERMISSAO_DA_AREA[area];
  return req ? u.permissoes.includes(req) : true;
}

// Área inicial conforme o papel (para onde redirecionar ao entrar / sem acesso).
export function areaInicial(u: UsuarioLogado | null): Area {
  if (u?.papel === 'cliente') return 'portal';
  return 'dashboard';
}
