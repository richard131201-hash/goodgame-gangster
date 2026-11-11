<!-- GERADO por docs/plano/gerar.mjs a partir de docs/plano/tarefas.mjs. NÃO EDITE À MÃO. -->

# Plano mestre: Mobster Rise

## Onde estamos

- Tarefas: **25** em **6** etapas
- Feitas: **10** (com nível 2 ou mais registrado: **1**)
- Em andamento: **0**
- Liberadas para começar: **5**
- Bloqueadas por outra tarefa ou etapa: **10**

| Etapa | Feitas / Total | Situação |
|---|---|---|
| A. Fundação do processo | 3 / 3 | Concluída |
| B. Verificação do que existe | 3 / 3 | Concluída |
| C. MVP jogável (local) | 4 / 9 | Liberada |
| D. Servidor e banco (Supabase) | 0 / 4 | Aguarda C |
| E. Estrutura e mercado (paralela) | 0 / 3 | Liberada |
| F. Lançamento e receita | 0 / 3 | Aguarda C |

## Tarefas por etapa

### Etapa A: Fundação do processo

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| A1 | Arquivo único de tarefas + gerador do plano e do painel (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |
| A2 | STATUS.md, DECISOES.md, fila de execução e CLAUDE.md (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |
| A3 | Memória do projeto (jeito de responder e decisões) (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |

### Etapa B: Verificação do que existe

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| B1 | Rodar testes, build, audit e jogar no localhost; registrar fatos (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |
| B2 | Mapear persistência e o que é real x simulado (ranking, família, eventos) (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |
| B3 | Conferir git remoto e site no ar na Vercel (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (site abre; não testei o ciclo completo no ar) |

### Etapa C: MVP jogável (local)

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| C1 | Lista de lacunas do MVP em ordem (ver STATUS.md) (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 |
| C2 | Energia regenera com o tempo (hoje o jogador trava sem energia). Pronto = teste automático + prova no localhost (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (120 s por ponto é hipótese; C6 revisa) |
| C3 | Corrigir erro de tipo em strike.ts:53 e criar script "typecheck" (o build não checa tipos) (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (npm run typecheck) |
| C4 | Trocar o nome para Mobster Rise (título, textos, criação de personagem); tirar "Goodgame Gangster" do que o jogador vê (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (título e criação; chave do save e comentários internos mantêm o nome antigo) |
| C5 | Ranking, Família e Eventos hoje são falsos: decidir o que o MVP mostra (NPCs assumidos) e implementar | FUNDADOR + CLAUDE | ⏳ A FAZER | Decisão sua; depois de C2 |
| C6 | Balanceamento do início (duelo de nível 1 perdido; inimigo de missão com 935 de vida) usando o simulador | CLAUDE | ⏳ A FAZER | Depois de C2 |
| C7 | Tutorial mínimo e teste de 30 a 60 minutos seguidos sem erro nem beco sem saída | CLAUDE | ⏳ A FAZER | Depois de C2, C4, C5 e C6 |
| C8 | Atualizar o README (descreve só a Fase 1) | CLAUDE | ⏳ A FAZER | Depois de C7 |
| C9 | Dependências com alerta no npm audit (zod alto; tinypool crítico): atualizar em cópia isolada com testes | CLAUDE | ⏳ A FAZER | Qualquer momento; saltos de versão maior são migração planejada |

### Etapa D: Servidor e banco (Supabase)

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| D1 | Arquitetura Supabase (contas, save, regras no servidor) com cenários de custo e recomendação | CLAUDE + FUNDADOR | ⏳ A FAZER | Depois do MVP; a aprovação é sua |
| D2 | Contas e save no banco; ouro, itens, drops e resultado de lutas decididos no servidor | CLAUDE | ⏳ A FAZER | Depois de D1; antes de qualquer pagamento |
| D3 | Ranking e Família reais (jogadores de verdade) | CLAUDE | ⏳ A FAZER | Depois de D2 |
| D4 | Antifraude do produto: limites, rate limit, auditoria de transações, contas duplicadas | CLAUDE | ⏳ A FAZER | Depois de D2, antes de abrir ao público |

### Etapa E: Estrutura e mercado (paralela)

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| E1 | Busca de marca "Mobster Rise" e registro de domínio | FUNDADOR | ⏳ A FAZER | Em paralelo; antes de divulgar |
| E2 | Termos de uso e política de privacidade (exigidos ao criar conta); classificação 14+. Revisão profissional a confirmar | FUNDADOR | ⏳ A FAZER | Em paralelo; antes de abrir cadastro |
| E3 | Escolher meio de pagamento (adulto responsável paga) e política de estorno | FUNDADOR + CLAUDE | ⏳ A FAZER | Depois de D2 |

### Etapa F: Lançamento e receita

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| F1 | Teste fechado com poucos jogadores e coleta de feedback | FUNDADOR + CLAUDE | ⏳ A FAZER | Depois de C7 |
| F2 | Divulgação nostálgica (lista de espera, comunidades) só com demonstração real | FUNDADOR | ⏳ A FAZER | Depois de F1 |
| F3 | Loja paga ativa (pay to win com limite definido pelo simulador) | CLAUDE | ⏳ A FAZER | Depois de D2, D4 e E3 |
