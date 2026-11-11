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
  { id: 'D', nome: 'Servidor e banco (Supabase)', dependeDe: [] },
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
  { id: 'C2', etapa: 'C', titulo: 'Energia regenera com o tempo (hoje o jogador trava sem energia). Pronto = teste automático + prova no localhost', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (regra do fundador: 7 min por ponto, teto 100; R-ENERGIA-1)', depende: ['C1'] },
  { id: 'C3', etapa: 'C', titulo: 'Corrigir erro de tipo em strike.ts:53 e criar script "typecheck" (o build não checa tipos)', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (npm run typecheck)', depende: ['C1'] },
  { id: 'C4', etapa: 'C', titulo: 'Trocar o nome para Mobster Rise (título, textos, criação de personagem); tirar "Goodgame Gangster" do que o jogador vê', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11 (título e criação; chave do save e comentários internos mantêm o nome antigo)', depende: ['C1'] },
  { id: 'C5', etapa: 'C', titulo: 'Ranking, Família e Eventos hoje são falsos: decidir o que o MVP mostra (NPCs assumidos) e implementar', dono: 'FUNDADOR + CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11: NPCs assumidos (escolha do Claude, autorizada pelo fundador; pode trocar)', depende: ['C1'] },
  { id: 'C6', etapa: 'C', titulo: 'Balanceamento do início (duelo de nível 1 perdido; inimigo de missão com 935 de vida) usando o simulador', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C2', depende: ['C1'] },
  { id: 'C7', etapa: 'C', titulo: 'Tutorial mínimo e teste de 30 a 60 minutos seguidos sem erro nem beco sem saída', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C2, C4, C5 e C6', depende: ['C2', 'C4', 'C5', 'C6'] },
  { id: 'C8', etapa: 'C', titulo: 'Atualizar o README (descreve só a Fase 1)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de C7', depende: ['C7'] },
  { id: 'C9', etapa: 'C', titulo: 'Dependências com alerta no npm audit (zod alto; tinypool crítico): atualizar em cópia isolada com testes', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Adiado para o início de D2 (zod passa a validar dado de fora); risco atual baixo, ver DECISOES.md', depende: ['C1'] },

  // ---- D ----
  { id: 'C11', etapa: 'C', titulo: 'Margem preta em % no desktop (R-LAYOUT-1), abas em 2 linhas e perfil em 1 coluna nos desktops menores', dono: 'CLAUDE', estado: 'FEITO', nivel: 1, quando: 'Feito em 2026-11-11: medido de 1024 a 2560 px (6% de cada lado)', depende: [] },
  { id: 'D2e', etapa: 'D', titulo: 'Fluxo de entrada em 3 telas (Entrar / Crie seu personagem / Sua conta) com criador de variedade real: o jogador monta o personagem, nada é sorteado', dono: 'CLAUDE', estado: 'FEITO', nivel: 2, quando: 'Feito em 2026-11-11: provado no localhost e também no site da Vercel (conta criada pelo fluxo, personagem escolhido no save, sair e entrar), com a conta de teste apagada', depende: [] },
  { id: 'D0a', etapa: 'D', titulo: 'Criar conta e projeto no Supabase (2FA), rodar a migração 001 no SQL Editor e colocar as chaves em .env.local e na Vercel. Nunca no chat (passo a passo no chat)', dono: 'FUNDADOR', estado: 'FEITO', nivel: 2, quando: 'Feito em 2026-11-11: variáveis VITE_ na Vercel confirmadas no site no ar. A chave secreta fica fora da Vercel até a etapa D2c', depende: [] },
  { id: 'D1', etapa: 'D', titulo: 'Arquitetura Supabase (docs/arquitetura/BANCO_DE_DADOS.md) com cenários de custo e recomendação', dono: 'CLAUDE + FUNDADOR', estado: 'FEITO', nivel: 0, quando: 'Aprovado em 2026-11-11 com as recomendações (login e-mail e senha primeiro; Google depois; saves locais descartados; lógica nas funções da Vercel)', depende: [] },
  { id: 'D2a', etapa: 'D', titulo: 'Migração 001 (tabela de jogadores, RLS, visão pública) em supabase/migrations. Pronto = rodou no projeto real e o teste de RLS prova que um jogador não lê nem grava dado de outro', dono: 'CLAUDE', estado: 'FEITO', nivel: 2, quando: 'Feito em 2026-11-11: 15 de 15 verificações de segurança passaram no banco real (npm run test:rls)', depende: [] },
  { id: 'D2b', etapa: 'D', titulo: 'Criar conta e entrar (e-mail e senha) dentro do jogo; sem as chaves o jogo segue em modo local', dono: 'CLAUDE', estado: 'FEITO', nivel: 2, quando: 'Feito em 2026-11-11: provado no localhost e também no site da Vercel (criar conta, sair, senha errada, entrar, personagem restaurado), com a conta de teste apagada no fim', depende: ['D0a', 'D2a'] },
  { id: 'D2c', etapa: 'D', titulo: 'Personagem e progresso salvos no banco por função do servidor (Vercel), nunca direto do navegador', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2b', depende: ['D2b'] },
  { id: 'D2d', etapa: 'D', titulo: 'Ver outros jogadores reais (ranking real) na aba Ranking', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2c', depende: ['D2c'] },
  { id: 'D2', etapa: 'D', titulo: 'Ações do jogo (missões, duelos, loja, drops, energia) decididas no servidor, à prova de trapaça', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2c; antes de qualquer pagamento', depende: ['D2c'] },
  { id: 'D3', etapa: 'D', titulo: 'Famílias reais (jogadores de verdade)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2d', depende: ['D2d'] },
  { id: 'D4', etapa: 'D', titulo: 'Antifraude do produto: limites, rate limit, auditoria de transações, contas duplicadas', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2, antes de abrir ao público', depende: ['D2'] },

  // ---- E (paralela) ----
  { id: 'E1', etapa: 'E', titulo: 'Busca de marca "Mobster Rise" e registro de domínio', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Em paralelo; antes de divulgar', depende: [] },
  { id: 'E2', etapa: 'E', titulo: 'Termos de uso e política de privacidade (exigidos ao criar conta); classificação 14+. Revisão profissional a confirmar', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Em paralelo; antes de abrir cadastro', depende: [] },
  { id: 'E3', etapa: 'E', titulo: 'Escolher meio de pagamento (adulto responsável paga) e política de estorno', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2', depende: ['D2'] },

  // ---- F ----
  { id: 'C10', etapa: 'C', titulo: 'Layout do jogo no celular: a página transborda na horizontal (413 px numa tela de 390). Pronto = sem rolagem lateral em 360 a 430 px', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Antes de divulgar; achado em 2026-11-11 (já existia antes do login)', depende: ['C1'] },
  { id: 'C13', etapa: 'C', titulo: 'Botão "Personalizar Visual do Gangster" do perfil não faz nada: reaproveitar o criador novo para mudar o visual depois (decidir se custa algo)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Achado em 2026-11-11; depois de C10', depende: ['C1'] },
  { id: 'E5', etapa: 'E', titulo: 'Esqueci a senha (recuperar por e-mail): depende de E4 (envio de e-mail do Supabase)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de E4', depende: ['E4'] },
  { id: 'C15', etapa: 'C', titulo: 'Novo estilo de personagem (rosto com volume, menos "boneco") e mais personalização: olhos, sobrancelhas, nariz, boca, orelhas, cabelo, óculos, cicatriz, charuto etc. Prévia interativa mostrada em 2026-11-11; aguarda aprovação do estilo antes de implementar. Inclui redesenhar trajes, mulheres e as poses de combate (atacar, tomar dano, esquivar)', dono: 'FUNDADOR + CLAUDE', estado: 'BLOQUEADA', nivel: 0, quando: 'EM ESPERA (decisão do fundador em 2026-11-11: mexer depois). Protótipo guardado em prototipos/rosto-v1. Falta decidir a fonte da arte: A artista, B kit licenciado', depende: [] },
  { id: 'E4', etapa: 'E', titulo: 'Antes de abrir ao público: ligar a confirmação de e-mail no Supabase, configurar o e-mail de envio e a URL do site (Authentication)', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Antes de divulgar; hoje a confirmação está desligada só para testes', depende: [] },
  { id: 'F1', etapa: 'F', titulo: 'Teste fechado com poucos jogadores e coleta de feedback', dono: 'FUNDADOR + CLAUDE', estado: 'A_FAZER', quando: 'Depois de C7', depende: ['C7'] },
  { id: 'F2', etapa: 'F', titulo: 'Divulgação nostálgica (lista de espera, comunidades) só com demonstração real', dono: 'FUNDADOR', estado: 'A_FAZER', quando: 'Depois de F1', depende: ['F1'] },
  { id: 'F3', etapa: 'F', titulo: 'Loja paga ativa (pay to win com limite definido pelo simulador)', dono: 'CLAUDE', estado: 'A_FAZER', quando: 'Depois de D2, D4 e E3', depende: ['D2', 'D4', 'E3'] },
];

// Ordem do que fazer agora, com o porquê da posição.
export const fila = [
  ['D0a', 'Sua parte, a mais urgente: sem o projeto no Supabase o banco não sai do papel (passo a passo no chat).'],
  ['D2a', 'SQL já escrito; falta rodar no banco real e provar a segurança.'],
  ['D2b', 'Conta de verdade dentro do jogo.'],
  ['C10', 'O jogo transborda no celular; quem vem de celular vê a página cortada.'],
  ['D2c', 'Progresso salvo no banco.'],
  ['D2d', 'Ver outros jogadores no Ranking, para testar.'],
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
];
