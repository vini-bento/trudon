// Base de conhecimento contábil/fiscal da Trudon IA (fase 1, offline).
//
// Conteúdo educativo de apoio ao dia a dia do escritório. Valores e prazos
// seguem regras gerais e PODEM mudar por legislação — a IA sempre recomenda
// conferir a norma vigente nos temas sensíveis.
//
// Na fase 2, este "cérebro" local continua como camada de fallback, e as
// perguntas abertas passam a ser respondidas pela Claude (Anthropic) via
// backend seguro.

export interface ItemConhecimento {
  id: string;
  titulo: string;
  // Palavras-chave (já normalizadas, sem acento, minúsculas) usadas no ranking.
  palavras: string[];
  resposta: string;
}

export const baseConhecimento: ItemConhecimento[] = [
  {
    id: 'simples',
    titulo: 'Simples Nacional',
    palavras: ['simples', 'nacional', 'das', 'anexo', 'regime', 'optante'],
    resposta:
      'O **Simples Nacional** é um regime unificado para micro e pequenas empresas, com faturamento anual de até **R$ 4,8 milhões**. Recolhe vários tributos numa guia única, o **DAS**, com alíquota progressiva conforme o anexo (I a V) e a receita dos últimos 12 meses. Vantagens: simplicidade e, em geral, carga menor. Atenção ao **sublimite estadual** (R$ 3,6 mi) para ICMS/ISS. *Confirme enquadramento e anexo no PGDAS-D.*',
  },
  {
    id: 'presumido',
    titulo: 'Lucro Presumido',
    palavras: ['presumido', 'lucro', 'regime', 'irpj', 'csll', 'presuncao'],
    resposta:
      'No **Lucro Presumido** o IRPJ e a CSLL incidem sobre uma **margem de lucro presumida** pela Receita (ex.: 8% para comércio/indústria e 32% para serviços, no IRPJ). Indicado para empresas com margem real **acima** da presumida e faturamento até **R$ 78 milhões/ano**. PIS/COFINS são cumulativos (0,65% + 3%). Apuração trimestral.',
  },
  {
    id: 'real',
    titulo: 'Lucro Real',
    palavras: ['real', 'lucro', 'regime', 'lalur', 'prejuizo', 'ecf'],
    resposta:
      'No **Lucro Real**, IRPJ e CSLL incidem sobre o **lucro contábil ajustado** (adições/exclusões via LALUR). Obrigatório para alguns setores e faturamento acima de R$ 78 mi. Vantajoso para margens baixas ou prejuízo (não paga IRPJ/CSLL sobre prejuízo). PIS/COFINS normalmente **não cumulativos** (permitem créditos). Exige escrituração rigorosa (ECD/ECF).',
  },
  {
    id: 'mei',
    titulo: 'MEI',
    palavras: ['mei', 'microempreendedor', 'individual', 'dasn', 'das-simei'],
    resposta:
      'O **MEI** (Microempreendedor Individual) tem limite de faturamento de **R$ 81.000/ano** e paga um valor fixo mensal (DAS-SIMEI) que cobre INSS + ICMS/ISS. Permite 1 empregado e emissão de notas. Declaração anual: **DASN-SIMEI**. *O limite pode ser reajustado por lei — confirme o valor vigente.*',
  },
  {
    id: 'das',
    titulo: 'DAS — Documento de Arrecadação do Simples',
    palavras: ['das', 'guia', 'simples', 'vencimento', 'pgdas'],
    resposta:
      'O **DAS** é a guia única do Simples Nacional, gerada no **PGDAS-D**. Vence, em regra, no **dia 20 do mês seguinte** ao período de apuração. Atraso gera multa e juros (Selic). É possível parcelar débitos do Simples.',
  },
  {
    id: 'dctfweb',
    titulo: 'DCTFWeb',
    palavras: ['dctfweb', 'dctf', 'confissao', 'darf', 'contribuicoes'],
    resposta:
      'A **DCTFWeb** confessa as contribuições previdenciárias e de terceiros, integrada ao eSocial e à EFD-Reinf. Após o envio, gera o **DARF** para recolhimento. Prazo usual: até o **dia 15** do mês seguinte ao fato gerador (antecipa quando cai em dia não útil).',
  },
  {
    id: 'esocial',
    titulo: 'eSocial',
    palavras: ['esocial', 'folha', 'admissao', 'rescisao', 'trabalhista', 'eventos'],
    resposta:
      'O **eSocial** unifica o envio de informações trabalhistas, previdenciárias e fiscais (admissões, afastamentos, folha, rescisões). A folha mensal costuma ser fechada até o **dia 15** do mês seguinte. Admissão deve ser enviada **antes** do início do trabalho.',
  },
  {
    id: 'fgts',
    titulo: 'FGTS Digital',
    palavras: ['fgts', 'digital', 'deposito', 'guia', 'rescisorio'],
    resposta:
      'O **FGTS Digital** gera as guias de recolhimento a partir dos eventos do eSocial, com pagamento via Pix. Vencimento mensal usual: **dia 20**. O FGTS rescisório tem prazo próprio na rescisão.',
  },
  {
    id: 'sped',
    titulo: 'SPED (ECD e ECF)',
    palavras: ['sped', 'ecd', 'ecf', 'escrituracao', 'digital', 'fiscal', 'contabil'],
    resposta:
      'O **SPED** digitaliza obrigações. A **ECD** (Escrituração Contábil Digital) transmite diário, razão e balancetes; a **ECF** (Escrituração Contábil Fiscal) apura IRPJ/CSLL e amarra com a ECD. São anuais, com prazos definidos a cada ano pela Receita. *Confirme o prazo do exercício vigente.*',
  },
  {
    id: 'pis-cofins',
    titulo: 'PIS e COFINS',
    palavras: ['pis', 'cofins', 'cumulativo', 'credito', 'contribuicao'],
    resposta:
      '**PIS** e **COFINS** incidem sobre o faturamento. No regime **cumulativo** (Presumido): 0,65% + 3,00%, sem créditos. No **não cumulativo** (Real): 1,65% + 7,60%, mas com direito a **créditos** sobre insumos. O Simples recolhe ambos dentro do DAS.',
  },
  {
    id: 'icms-iss',
    titulo: 'ICMS x ISS',
    palavras: ['icms', 'iss', 'mercadoria', 'servico', 'estadual', 'municipal'],
    resposta:
      'O **ICMS** é estadual e incide sobre **circulação de mercadorias** e alguns serviços (transporte intermunicipal, comunicação). O **ISS** é municipal e incide sobre **serviços** da lista da LC 116. Regra prática: vendeu produto → ICMS; prestou serviço → ISS.',
  },
  {
    id: 'partidas-dobradas',
    titulo: 'Partidas dobradas (débito e crédito)',
    palavras: ['partida', 'dobrada', 'debito', 'credito', 'lancamento', 'razao'],
    resposta:
      'O método das **partidas dobradas** diz que **todo débito tem um crédito de igual valor**. Contas de natureza **devedora** (Ativo, Despesa) aumentam a débito; contas **credoras** (Passivo, PL, Receita) aumentam a crédito. Por isso o **balancete sempre fecha**: total de débitos = total de créditos. Veja na aba Contabilidade.',
  },
  {
    id: 'dre',
    titulo: 'DRE — Demonstração do Resultado',
    palavras: ['dre', 'resultado', 'receita', 'despesa', 'lucro', 'margem'],
    resposta:
      'A **DRE** confronta **receitas e despesas** do período para apurar o resultado (lucro ou prejuízo). De forma simplificada: Receitas − Despesas = Resultado. A **margem** é o resultado dividido pela receita. No Trudon, a DRE por empresa fica na aba **Contabilidade → DRE**.',
  },
  {
    id: 'competencia-caixa',
    titulo: 'Regime de competência x caixa',
    palavras: ['competencia', 'caixa', 'regime', 'reconhecimento'],
    resposta:
      'No **regime de competência**, receitas e despesas são reconhecidas **quando ocorrem** (fato gerador), independentemente do pagamento. No **regime de caixa**, só quando o dinheiro **entra ou sai**. A contabilidade segue, em regra, a **competência**; o fluxo de caixa segue o **caixa**.',
  },
  {
    id: 'depreciacao',
    titulo: 'Depreciação',
    palavras: ['depreciacao', 'imobilizado', 'bem', 'vida util', 'ciap'],
    resposta:
      'A **depreciação** reconhece a perda de valor de um bem do imobilizado ao longo da **vida útil** (ex.: veículos 5 anos/20% a.a., móveis 10 anos/10% a.a.). Lança-se despesa de depreciação a débito e depreciação acumulada a crédito. Em alguns casos gera crédito de ICMS via **CIAP**.',
  },
  {
    id: '13-ferias',
    titulo: '13º salário e férias',
    palavras: ['decimo', 'terceiro', '13', 'ferias', 'provisao', 'gratificacao'],
    resposta:
      'O **13º salário** é pago em duas parcelas (1ª até 30/11, 2ª até 20/12). As **férias** são de 30 dias após 12 meses de trabalho, com adicional de **1/3 constitucional**, pagas até 2 dias antes do início. Contabilmente, ambos costumam ser **provisionados** mensalmente.',
  },
];

const LIMIAR = 2; // pontuação mínima para considerar uma resposta confiável

/**
 * Procura o item de conhecimento mais relevante para a pergunta normalizada.
 * Retorna null quando nenhum item atinge o limiar de confiança.
 */
export function buscarConhecimento(
  perguntaNormalizada: string,
): ItemConhecimento | null {
  let melhor: ItemConhecimento | null = null;
  let melhorPontos = 0;

  for (const item of baseConhecimento) {
    let pontos = 0;
    for (const palavra of item.palavras) {
      if (perguntaNormalizada.includes(palavra)) {
        // Palavras mais longas/específicas valem mais.
        pontos += palavra.length >= 5 ? 2 : 1;
      }
    }
    if (pontos > melhorPontos) {
      melhorPontos = pontos;
      melhor = item;
    }
  }

  return melhorPontos >= LIMIAR ? melhor : null;
}
