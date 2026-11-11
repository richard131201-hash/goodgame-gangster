// FONTE ÚNICA do plano mestre. Edite SOMENTE este arquivo e rode: npm run plano
// Gera: docs/PLANO_MESTRE.md e docs/FILA_DE_EXECUCAO.md (nunca edite esses à mão).
//
// estado: 'A_FAZER' | 'EM_ANDAMENTO' | 'FEITO' | 'BLOQUEADA'
// nivel (opcional): 0..3. Só preencha quando comprovado (ver STATUS.md).
// depende: IDs de tarefas que precisam estar FEITAS antes.

export const etapas = [
  { id: 'A', nome: 'Fundação do processo', dependeDe: [] },
  { id: 'B', nome: 'Verificação do que existe', dependeDe: ['A'] },
  { id: 'C', nome: 'MVP jogável (local)', dependeDe: ['B'] },
  { id: 'D', nome: 'Servidor e banco (Supabase)', dependeDe: ['C'] },
  { id: 'E', nome: 'Estrutura e mercado (paralela)', dependeDe: [] },
  { id: 'F', nome: 'Lançamento e receita', dependeDe: ['C'] },
];

export const tarefas = [
  // ---- A ----
  { id: 'A1', etapa: 'A', titulo: 'Arquivo único de tarefas + gerador do plano e do painel', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: [] },
  { id: 'A2', etapa: 'A', titulo: 'STATUS.md, DECISOES.md, fila de execução e CLAUDE.md', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: ['A1'] },
  { id: 'A3', etapa: 'A', titulo: 'Memória do projeto (jeito de responder e decisões)', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: [] },

  // ---- B ----
  { id: 'B1', etapa: 'B', titulo: 'Rodar testes, build, audit e jogar no localhost; registrar fatos', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: ['A2'] },
  { id: 'B2', etapa: 'B', titulo: 'Mapear persistência e o que é real x simulado (ranking, família, eventos)', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: ['A2'] },
  { id: 'B3', etapa: 'B', titulo: 'Conferir git remoto e site no ar na Vercel', dono: 'CLAUDE', estado: 'FEITO', nivel: 2, quando: 'Feito em 2026-11-11 (site abre; não testei o ciclo completo no ar)', depende: [] },

  // ---- C ----
  { id: 'C1', etapa: 'C', titulo: 'Lista de lacunas do MVP em ordem (ver STATUS.md)', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11', depende: ['B1'] },
  { id: 'C2', etapa: 'C', titulo: 'Energia regenera com o tempo (hoje o jogador trava sem energia). Pronto = teste automático + prova no localhost', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (120 s por ponto é hipótese; C6 revisa)', depende: ['C1'] },
  { id: 'C3', etapa: 'C', titulo: 'Corrigir erro de tipo em strike.ts:53 e criar script "typecheck" (o build não checa tipos)', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (npm run typecheck)', depende: ['C1'] },
  { id: 'C4', etapa: 'C', titulo: 'Trocar o nome para Mobster Rise (título, textos, criação de personagem); tirar "Goodgame Gangster" do que o jogador vê', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (título e criação; chave do save e comentários internos mantêm o nome antigo)', depende: ['C1'] },
  { id: 'C5', etapa: 'C', titulo: 'Ranking, Família e Eventos hoje são falsos: decidir o que o MVP mostra (NPCs assumidos) e implementar', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Decisão sua; depois de C2', depende: ['C1'] },
  { id: 'C6', etapa: 'C', titulo: 'Balanceamento do início (duelo de nível 1 perdido; inimigo de missão com 935 de vida) usando o simulador', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C2', depende: ['C1'] },
  { id: 'C7', etapa: 'C', titulo: 'Tutorial mínimo e teste de 30 a 60 minutos seguidos sem erro nem beco sem saída', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C2, C4, C5 e C6', depende: ['C2', 'C4', 'C5', 'C6'] },
  { id: 'C8', etapa: 'C', titulo: 'Atualizar o README (descreve só a Fase 1)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C7', depende: ['C7'] },
  { id: 'C9', etapa: 'C', titulo: 'Dependências com alerta no npm audit (zod alto; tinypool crítico): atualizar em cópia isolada com testes', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Qualquer momento; saltos de versão maior são migração planejada', depende: ['C1'] },

  // ---- D ----
  { id: 'D1', etapa: 'D', titulo: 'Arquitetura Supabase (contas, save, regras no servidor) com cenários de custo e recomendação', dono: 'CLAUDE + FUNDADOR', estado: 'A_FAZER', quando: 'Depois do MVP; a aprovação é sua', depende: ['C7'] },
  { id: 'D2', etapa: 'D', titulo: 'Contas e save no banco; ouro, itens, drops e resultado de lutas decididos no servidor', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D1; antes de qualquer pagamento', depende: ['D1'] },
  { id: 'D3', etapa: 'D', titulo: 'Ranking e Família reais (jogadores de verdade)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2', depende: ['D2'] },
  { id: 'D4', etapa: 'D', titulo: 'Antifraude do produto: limites, rate limit, auditoria de transações, contas duplicadas', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2, antes de abrir ao público', depende: ['D2'] },

  // ---- E (paralela) ----
  { id: 'E1', etapa: 'E', titulo: 'Busca de marca "Mobster Rise" e registro de domínio', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Em paralelo; antes de divulgar', depende: [] },
  { id: 'E2', etapa: 'E', titulo: 'Termos de uso e política de privacidade (exigidos ao criar conta); classificação 14+. Revisão profissional a confirmar', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Em paralelo; antes de abrir cadastro', depende: [] },
  { id: 'E3', etapa: 'E', titulo: 'Escolher meio de pagamento (adulto responsável paga) e política de estorno', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2', depende: ['D2'] },

  // ---- F ----
  { id: 'F1', etapa: 'F', titulo: 'Teste fechado com poucos jogadores e coleta de feedback', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Depois de C7', depende: ['C7'] },
  { id: 'F2', etapa: 'F', titulo: 'Divulgação nostálgica (lista de espera, comunidades) só com demonstração real', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Depois de F1', depende: ['F1'] },
  { id: 'F3', etapa: 'F', titulo: 'Loja paga ativa (pay to win com limite definido pelo simulador)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2, D4 e E3', depende: ['D2', 'D4', 'E3'] },
];

// Ordem do que fazer agora, com o porquê da posição.
export const fila = [
  ['C2', 'Sem regeneração de energia o jogador trava em poucas missões: bloqueia qualquer teste longo.'],
  ['C3', 'Barato e evita erro de tipo escondido, pois o build não checa tipos.'],
  ['C4', 'Nome e marca: o jogo no ar ainda se chama SUBMUNDO e cita Goodgame Gangster.'],
  ['C5', 'Precisa da sua decisão; define o que o jogador vê em Ranking, Família e Eventos.'],
  ['C6', 'Primeira impressão: o início precisa ser justo e divertido.'],
  ['C7', 'Fecha o MVP: prova de 30 a 60 minutos de jogo seguido.'],
  ['C9', 'Segurança das dependências; pode entrar entre as outras.'],
  ['C8', 'Documentação, depois que o MVP estiver estável.'],
  ['E1', 'Em paralelo: sua parte (marca e domínio).'],
  ['E2', 'Em paralelo: sua parte (termos, privacidade, classificação).'],
  ['D1', 'Primeira tarefa da etapa do servidor, após o MVP.'],
];
