// Geração determinística dos dados-semente do Trudon ERP.
// Tudo fictício. Ancorado na data atual para que prazos e competências
// façam sentido sempre que o app for aberto.
import {
  addDays,
  addMonths,
  format,
  setDate,
  startOfMonth,
  subMonths,
} from 'date-fns';
import type {
  Cobranca,
  Contrato,
  Documento,
  Empresa,
  Lancamento,
  Obrigacao,
  StatusCobranca,
  Usuario,
} from './types';

// PRNG determinístico (mulberry32) para dados estáveis entre execuções.
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const comp = (d: Date) => format(d, 'yyyy-MM');

const HOJE = new Date();
const COMPETENCIA_ATUAL = comp(HOJE);

// ---------------------------------------------------------------------------
// Equipe do escritório
// ---------------------------------------------------------------------------
export const usuarios: Usuario[] = [
  { id: 'u1', nome: 'Vinícius Bento', email: 'vinicius@trudon.com.br', cargo: 'Sócio-Diretor', departamento: 'Contábil', iniciais: 'VB' },
  { id: 'u2', nome: 'Helena Rocha', email: 'helena@trudon.com.br', cargo: 'Contadora Sênior', departamento: 'Contábil', iniciais: 'HR' },
  { id: 'u3', nome: 'Marcos Andrade', email: 'marcos@trudon.com.br', cargo: 'Analista Fiscal', departamento: 'Fiscal', iniciais: 'MA' },
  { id: 'u4', nome: 'Beatriz Lima', email: 'beatriz@trudon.com.br', cargo: 'Analista de Pessoal', departamento: 'Pessoal', iniciais: 'BL' },
  { id: 'u5', nome: 'Rafael Souza', email: 'rafael@trudon.com.br', cargo: 'Analista Societário', departamento: 'Societário', iniciais: 'RS' },
  { id: 'u6', nome: 'Carla Nunes', email: 'carla@trudon.com.br', cargo: 'Financeiro', departamento: 'Financeiro', iniciais: 'CN' },
];

export const USUARIO_LOGADO = usuarios[0];

// ---------------------------------------------------------------------------
// Empresas-cliente
// ---------------------------------------------------------------------------
const empresasBase: Array<
  Omit<Empresa, 'socios'> & { socios: Empresa['socios'] }
> = [
  {
    id: 'e1', razaoSocial: 'Aurora Tecnologia e Sistemas Ltda', nomeFantasia: 'Aurora Tech',
    cnpj: '12345678000190', regime: 'Lucro Presumido', situacao: 'Ativa', segmento: 'Tecnologia',
    cidade: 'São Paulo', uf: 'SP', aberturaEm: '2018-03-12', email: 'financeiro@auroratech.com.br',
    telefone: '11987654321', responsavelId: 'u2',
    socios: [
      { nome: 'Daniel Prado', cpf: '11122233396', participacao: 60 },
      { nome: 'Marina Prado', cpf: '22233344407', participacao: 40 },
    ],
  },
  {
    id: 'e2', razaoSocial: 'Belluno Comércio de Alimentos Ltda', nomeFantasia: 'Belluno Mercado',
    cnpj: '23456789000181', regime: 'Simples Nacional', situacao: 'Ativa', segmento: 'Comércio',
    cidade: 'Campinas', uf: 'SP', aberturaEm: '2015-07-01', email: 'contato@belluno.com.br',
    telefone: '19988776655', responsavelId: 'u2',
    socios: [{ nome: 'Giuseppe Belluno', cpf: '33344455518', participacao: 100 }],
  },
  {
    id: 'e3', razaoSocial: 'Construtora Horizonte S/A', nomeFantasia: 'Horizonte Engenharia',
    cnpj: '34567890000172', regime: 'Lucro Real', situacao: 'Ativa', segmento: 'Construção Civil',
    cidade: 'Rio de Janeiro', uf: 'RJ', aberturaEm: '2009-11-20', email: 'fiscal@horizonteeng.com.br',
    telefone: '21997654321', responsavelId: 'u3',
    socios: [
      { nome: 'Eduardo Castro', cpf: '44455566629', participacao: 50 },
      { nome: 'Patrícia Mendes', cpf: '55566677730', participacao: 50 },
    ],
  },
  {
    id: 'e4', razaoSocial: 'Clínica Vida Plena Ltda', nomeFantasia: 'Vida Plena',
    cnpj: '45678901000163', regime: 'Lucro Presumido', situacao: 'Ativa', segmento: 'Saúde',
    cidade: 'Belo Horizonte', uf: 'MG', aberturaEm: '2017-02-14', email: 'adm@vidaplena.com.br',
    telefone: '31988112233', responsavelId: 'u2',
    socios: [{ nome: 'Dra. Sônia Vasconcelos', cpf: '66677788841', participacao: 100 }],
  },
  {
    id: 'e5', razaoSocial: 'Joaquim Pereira Transportes ME', nomeFantasia: 'JP Transportes',
    cnpj: '56789012000154', regime: 'Simples Nacional', situacao: 'Ativa', segmento: 'Transporte',
    cidade: 'Curitiba', uf: 'PR', aberturaEm: '2020-09-05', email: 'jp@jptransportes.com.br',
    telefone: '41999887766', responsavelId: 'u3',
    socios: [{ nome: 'Joaquim Pereira', cpf: '77788899952', participacao: 100 }],
  },
  {
    id: 'e6', razaoSocial: 'Marés Turismo e Hotelaria Ltda', nomeFantasia: 'Marés Hotel',
    cnpj: '67890123000145', regime: 'Lucro Presumido', situacao: 'Suspensa', segmento: 'Turismo',
    cidade: 'Florianópolis', uf: 'SC', aberturaEm: '2012-05-30', email: 'reservas@mareshotel.com.br',
    telefone: '48988443322', responsavelId: 'u2',
    socios: [
      { nome: 'Roberto Maré', cpf: '88899900063', participacao: 70 },
      { nome: 'Lúcia Maré', cpf: '99900011174', participacao: 30 },
    ],
  },
  {
    id: 'e7', razaoSocial: 'Verde Vale Agronegócios S/A', nomeFantasia: 'Verde Vale',
    cnpj: '78901234000136', regime: 'Lucro Real', situacao: 'Ativa', segmento: 'Agronegócio',
    cidade: 'Ribeirão Preto', uf: 'SP', aberturaEm: '2006-01-18', email: 'controladoria@verdevale.agr.br',
    telefone: '16997112244', responsavelId: 'u3',
    socios: [{ nome: 'Fernando Tavares', cpf: '10111213145', participacao: 100 }],
  },
  {
    id: 'e8', razaoSocial: 'Studio Criativo Pixel Ltda', nomeFantasia: 'Pixel Studio',
    cnpj: '89012345000127', regime: 'Simples Nacional', situacao: 'Ativa', segmento: 'Publicidade',
    cidade: 'Porto Alegre', uf: 'RS', aberturaEm: '2021-08-22', email: 'ola@pixelstudio.com.br',
    telefone: '51988556677', responsavelId: 'u2',
    socios: [
      { nome: 'Tatiana Reis', cpf: '12131415156', participacao: 50 },
      { nome: 'Bruno Reis', cpf: '13141516167', participacao: 50 },
    ],
  },
  {
    id: 'e9', razaoSocial: 'Antônio Comércio de Materiais MEI', nomeFantasia: 'Materiais do Antônio',
    cnpj: '90123456000118', regime: 'MEI', situacao: 'Ativa', segmento: 'Comércio',
    cidade: 'Salvador', uf: 'BA', aberturaEm: '2022-04-10', email: 'antonio.materiais@gmail.com',
    telefone: '71988009911', responsavelId: 'u3',
    socios: [{ nome: 'Antônio Carlos Silva', cpf: '14151617178', participacao: 100 }],
  },
];

export const empresas: Empresa[] = empresasBase;

// ---------------------------------------------------------------------------
// Lançamentos contábeis (por empresa, competência atual)
// ---------------------------------------------------------------------------
function gerarLancamentos(): Lancamento[] {
  const out: Lancamento[] = [];
  const inicioMes = startOfMonth(HOJE);

  empresas.forEach((empresa, idx) => {
    const r = rng(1000 + idx);
    const escala = empresa.regime === 'MEI' ? 0.15 : empresa.regime === 'Lucro Real' ? 4 : 1;
    const n = empresa.situacao === 'Ativa' ? 9 : 3;

    // Roteiro mensal típico de lançamentos (partidas dobradas).
    const roteiro: Array<[string, string, number, string]> = [
      ['banco', 'receita-servicos', 18000, 'Recebimento de serviços prestados'],
      ['caixa', 'receita-vendas', 9500, 'Vendas à vista'],
      ['clientes', 'receita-servicos', 12000, 'Faturamento a prazo'],
      ['desp-salarios', 'salarios-pagar', 14500, 'Provisão de folha de salários'],
      ['desp-aluguel', 'banco', 6000, 'Pagamento de aluguel'],
      ['desp-impostos', 'impostos-pagar', 4200, 'Apuração de impostos do mês'],
      ['desp-fornecedores', 'fornecedores', 7800, 'Compra de mercadorias/insumos'],
      ['desp-gerais', 'banco', 3100, 'Despesas administrativas diversas'],
      ['banco', 'clientes', 8000, 'Liquidação de duplicatas'],
    ];

    for (let i = 0; i < n; i++) {
      const [deb, cred, base, hist] = roteiro[i];
      const variacao = 0.8 + r() * 0.5;
      const valor = Math.round(base * escala * variacao * 100) / 100;
      const dia = 1 + Math.floor(r() * 26);
      out.push({
        id: `${empresa.id}-l${i + 1}`,
        empresaId: empresa.id,
        data: iso(addDays(inicioMes, dia - 1)),
        historico: hist,
        contaDebitoId: deb,
        contaCreditoId: cred,
        valor,
        centroCusto: i % 2 === 0 ? 'Administrativo' : 'Operacional',
      });
    }
  });
  return out;
}

export const lancamentos: Lancamento[] = gerarLancamentos();

// ---------------------------------------------------------------------------
// Contratos e cobranças (Honorários)
// ---------------------------------------------------------------------------
const valoresHonorario: Record<string, number> = {
  e1: 2800, e2: 1450, e3: 6200, e4: 2100, e5: 980,
  e6: 2400, e7: 7800, e8: 1250, e9: 320,
};

export const contratos: Contrato[] = empresas.map((e, idx) => ({
  id: `c-${e.id}`,
  empresaId: e.id,
  descricao: `Honorários contábeis — ${e.nomeFantasia}`,
  valorMensal: valoresHonorario[e.id] ?? 1500,
  diaVencimento: [5, 10, 15, 20][idx % 4],
  ativo: e.situacao !== 'Baixada',
  inicioEm: e.aberturaEm,
}));

function gerarCobrancas(): Cobranca[] {
  const out: Cobranca[] = [];
  contratos.forEach((contrato, idx) => {
    const r = rng(2000 + idx);
    // Últimos 6 meses, incluindo o atual.
    for (let m = 5; m >= 0; m--) {
      const data = subMonths(HOJE, m);
      const venc = setDate(data, contrato.diaVencimento);
      let status: StatusCobranca;
      let pagoEm: string | undefined;
      if (m === 0) {
        // mês atual: pendente ou já pago
        const pago = r() > 0.6;
        status = pago ? 'Pago' : 'Pendente';
        if (pago) pagoEm = iso(addDays(venc, -2));
      } else {
        // meses passados: maioria paga, alguns atrasados
        const inadimplente = r() > 0.85;
        status = inadimplente ? 'Atrasado' : 'Pago';
        if (status === 'Pago') pagoEm = iso(addDays(venc, Math.floor(r() * 5)));
      }
      out.push({
        id: `cob-${contrato.empresaId}-${comp(data)}`,
        empresaId: contrato.empresaId,
        contratoId: contrato.id,
        competencia: comp(data),
        vencimento: iso(venc),
        valor: contrato.valorMensal,
        status,
        pagoEm,
      });
    }
  });
  return out;
}

export const cobrancas: Cobranca[] = gerarCobrancas();

// ---------------------------------------------------------------------------
// Obrigações / Processos (calendário de entregas)
// ---------------------------------------------------------------------------
const modelosObrigacao: Array<{
  titulo: string;
  tipo: Obrigacao['tipo'];
  departamento: Obrigacao['departamento'];
  dia: number;
}> = [
  { titulo: 'Apuração e DAS — Simples Nacional', tipo: 'Fiscal', departamento: 'Fiscal', dia: 20 },
  { titulo: 'DCTFWeb', tipo: 'Fiscal', departamento: 'Fiscal', dia: 15 },
  { titulo: 'eSocial — Folha de Pagamento', tipo: 'Trabalhista', departamento: 'Pessoal', dia: 15 },
  { titulo: 'FGTS Digital', tipo: 'Trabalhista', departamento: 'Pessoal', dia: 20 },
  { titulo: 'Escrituração Contábil do mês', tipo: 'Contábil', departamento: 'Contábil', dia: 25 },
  { titulo: 'EFD-Contribuições (PIS/COFINS)', tipo: 'Fiscal', departamento: 'Fiscal', dia: 14 },
];

function statusPorVencimento(
  venc: Date,
  concluida: boolean,
): { status: Obrigacao['status']; concluidaEm?: string } {
  if (concluida) return { status: 'Concluída', concluidaEm: iso(addDays(venc, -1)) };
  if (venc < HOJE) return { status: 'Atrasada' };
  // próxima dos vencimentos => em andamento; demais => pendente
  const dias = (venc.getTime() - HOJE.getTime()) / 86400000;
  return { status: dias <= 7 ? 'Em andamento' : 'Pendente' };
}

function gerarObrigacoes(): Obrigacao[] {
  const out: Obrigacao[] = [];
  empresas
    .filter((e) => e.situacao === 'Ativa')
    .forEach((empresa, idx) => {
      const r = rng(3000 + idx);
      // Obrigações aplicáveis variam por regime (modelo simplificado).
      const modelos = modelosObrigacao.filter((m) => {
        if (empresa.regime === 'MEI') return m.titulo.startsWith('Apuração');
        if (empresa.regime === 'Simples Nacional')
          return m.tipo !== 'Fiscal' || m.titulo.startsWith('Apuração') || m.titulo.includes('eSocial');
        return true;
      });
      modelos.forEach((modelo, j) => {
        const venc = setDate(startOfMonth(HOJE), modelo.dia);
        // itens já vencidos têm boa chance de estarem concluídos
        const concluida = venc < HOJE ? r() > 0.25 : false;
        const { status, concluidaEm } = statusPorVencimento(venc, concluida);
        out.push({
          id: `ob-${empresa.id}-${j}`,
          empresaId: empresa.id,
          titulo: modelo.titulo,
          tipo: modelo.tipo,
          competencia: COMPETENCIA_ATUAL,
          vencimento: iso(venc),
          status,
          responsavelId: empresa.responsavelId,
          departamento: modelo.departamento,
          concluidaEm,
        });
      });
    });
  return out;
}

export const obrigacoes: Obrigacao[] = gerarObrigacoes();

// ---------------------------------------------------------------------------
// Documentos publicados (Portal do Cliente)
// ---------------------------------------------------------------------------
const modelosDocumento: Array<{ nome: string; tipo: Documento['tipo'] }> = [
  { nome: 'Guia DAS', tipo: 'Guia' },
  { nome: 'Balancete Mensal', tipo: 'Balancete' },
  { nome: 'Folha de Pagamento', tipo: 'Folha' },
  { nome: 'Guia DARF — IRPJ', tipo: 'Guia' },
  { nome: 'Relatório Gerencial', tipo: 'Relatório' },
];

function gerarDocumentos(): Documento[] {
  const out: Documento[] = [];
  let protocolo = 240600;
  empresas
    .filter((e) => e.situacao !== 'Baixada')
    .forEach((empresa, idx) => {
      const r = rng(4000 + idx);
      modelosDocumento.forEach((modelo, j) => {
        if (empresa.regime === 'MEI' && modelo.tipo === 'Balancete') return;
        const publicado = addDays(startOfMonth(HOJE), 2 + j * 2);
        out.push({
          id: `doc-${empresa.id}-${j}`,
          empresaId: empresa.id,
          nome: `${modelo.nome} — ${format(HOJE, 'MM/yyyy')}`,
          tipo: modelo.tipo,
          competencia: COMPETENCIA_ATUAL,
          publicadoEm: iso(publicado),
          tamanhoKb: Math.round(80 + r() * 2400),
          protocolo: `TRD-${protocolo++}`,
          visualizado: r() > 0.5,
        });
      });
    });
  return out;
}

export const documentos: Documento[] = gerarDocumentos();

// Próxima competência (rótulo auxiliar)
export const PROXIMA_COMPETENCIA = comp(addMonths(HOJE, 1));
