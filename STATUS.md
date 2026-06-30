# STATUS — Trudon ERP

Estado do desenvolvimento e roadmap. Atualizar a cada etapa concluída.
Branch: `claude/accounting-app-review-qffa5p`.

## ✅ Pronto e testado (56 testes verdes)

### Cadastro de clientes (`src/pages/Empresas.tsx`)
- PF e PJ (seletor). Endereço brasileiro completo com **autocomplete de CEP**
  (ViaCEP). Múltiplos **contatos** (com "principal"). **Sócios** com qualificação
  e validação de 100%. **Bancos** (lista com códigos Compe, `src/data/bancos.ts`).
  Campos de **acessos governamentais** (certificado A1/A3, e-CAC) prontos.
- Persistência no Supabase: `src/lib/empresasApi.ts` + migration `0007`.

### Fiscal (`src/lib/fiscal/`, página `src/pages/Fiscal.tsx`)
- **Simples Nacional**: alíquota efetiva por faixa (LC 123/2006), **Fator R**
  (migra Anexo III↔V), DAS, e **MEI** (DAS-SIMEI fixo).
- **Lucro Presumido**: IRPJ + adicional, CSLL por presunção, PIS/COFINS
  cumulativos, **ISS** municipal configurável (não chutado).
- **Lucro Real**: IRPJ + adicional, CSLL, PIS/COFINS não-cumulativos com créditos.
- 16 testes. Memória de cálculo passo a passo na tela.

### Folha / Departamento Pessoal (`src/lib/folha/`, página `src/pages/Folha.tsx`)
- **Cadastro com seletor de modalidade**: CLT, Experiência, Intermitente,
  Temporário, Aprendiz, Estagiário, Autônomo (RPA), Pró-labore, PJ, Doméstico.
  O seletor governa as regras. **PJ** é encaminhado como prestador (retenções no
  Fiscal), não entra na folha.
- **Folha CLT completa**: salário, periculosidade/insalubridade, horas extras
  50/100, adicional noturno, faltas, VT; **INSS** (Portaria MPS/MF 13/2026),
  **IRRF** (Lei 15.270/2025), **FGTS** (8% ou 2% aprendiz), **encargos patronais**
  (CPP 20% + RAT×FAP + Terceiros 5,8%) conforme o regime da empresa.
- Adicionais **configuráveis por funcionário** (padrão CLT, ajustável por CCT).
- 14 testes. Memória de cálculo na tela.

### UI transversal
- `MoedaInput` (máscara R$) e `DocumentoInput` (máscara CPF/CNPJ/RG) aplicados
  nos campos relevantes.

## 🔒 Decisões fixas (não reabrir sem motivo)

- **IRRF 2026 — redutor da Lei 15.270/2025 (Art. 3º-A)**: a redução é indexada
  pela **BASE DE CÁLCULO** (após INSS e dependentes), NÃO pelo salário bruto.
  Faixas: base ≤ 5.000 → redução até R$ 312,89 (zera, limitada ao imposto §1);
  5.000,01–7.350 → R$ 978,62 − 0,133145×base; > 7.350 → sem redução. §3 estende
  a redução ao IRRF do 13º. (Confirmado no texto oficial da lei.)
- **Encargo patronal por regime**: Simples Anexos I–III/V → CPP já no DAS (só
  FGTS à parte); Anexo IV e Lucro Presumido/Real → 20% + RAT + Terceiros à parte.
- **INSS 2026**: faixas 7,5/9/12/14%, deduções 0/24,32/111,40/198,50, teto
  8.475,55. Salário mínimo 2026 = R$ 1.621,00.

## ⏳ A confirmar contra fonte oficial (sem chute)

- **IRRF**: obter um exemplo numérico oficial da Receita ("Perguntas e Respostas")
  e transformá-lo em teste de regressão.
- **Salário-família 2026**: valor da cota e limite de renda.
- **FGTS Digital**: data exata de vencimento vigente.
- **Retenções de PJ** por tipo de serviço (IN RFB 1.234) e ISS municipal.

## 📋 Roadmap (próximos passos)

1. **Folha — férias, 13º e rescisão** (próximo). Férias: 30 dias + 1/3, abono
   pecuniário, pagamento 2 dias antes. 13º: 2 parcelas (30/11 e 20/12), IRRF com
   o redutor (§3). Rescisão: todos os tipos (sem justa causa, pedido, justa
   causa, acordo 484-A, término), aviso prévio proporcional, multa FGTS 40%/20%,
   prazo 10 dias (art. 477).
2. **Demais modalidades de folha**: Autônomo/RPA e Pró-labore (INSS 11% + 20%
   patronal, IRRF, ISS, gera RPA); Estagiário (bolsa + seguro + recesso, sem
   encargos); Doméstico (DAE: FGTS 8% + 3,2% + patronal + seguro).
3. **Integrações**: Folha→Fiscal (Fator R automático a partir da folha 12m);
   Folha→Contabilidade (lançamentos automáticos da folha).
4. **Blindagem (segurança na UI)**: aplicar `papel`/`dono`/`permissoes` (já no
   banco, migrations 0001/0003) à interface; cliente vê só a própria empresa,
   sem edição; equipe conforme cargo/permissão; remover seed fictício para
   usuário logado. Dashboard/menus sensíveis por permissão.
5. **Portal do cliente real**: read-only da própria empresa + **upload de
   documentos** (Supabase Storage), com RLS.
6. **Tela de gestão de equipe** (só-donos) para cargos e permissões.
7. **Contabilidade e Documentos** → persistir no Supabase (hoje local).
8. **Trudon IA real**: deploy da edge function + `ANTHROPIC_API_KEY` (usuário
   precisa criar a chave na Anthropic).

## Migrations Supabase (rodar no SQL Editor, na ordem)

0001 empresas+perfis+RLS · 0002 honorários · 0003 permissões (donos por e-mail)
· 0004 obrigações · 0005 contabilidade (não plugado) · 0006 endereço · 0007
cadastro completo. (Conferir se todas foram aplicadas no projeto Supabase.)

## Como retomar numa nova conversa

1. Ler este `STATUS.md` e o `CLAUDE.md`.
2. `git checkout claude/accounting-app-review-qffa5p` e `npm install`.
3. `npm run test` (deve estar verde) e seguir o roadmap a partir do item 1.
