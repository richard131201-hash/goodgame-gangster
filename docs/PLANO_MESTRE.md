<!-- GERADO por docs/plano/gerar.mjs a partir de docs/plano/tarefas.mjs. NÃO EDITE À MÃO. -->

# Plano mestre: Mobster Rise

## Onde estamos

- Tarefas: **41** em **6** etapas
- Feitas: **21** (com nível 2 ou mais registrado: **7**)
- Em andamento: **0**
- Liberadas para começar: **11**
- Bloqueadas por outra tarefa ou etapa: **9**

| Etapa | Feitas / Total | Situação |
|---|---|---|
| A. Fundação do processo | 3 / 3 | Concluída |
| B. Verificação do que existe | 3 / 3 | Concluída |
| C. MVP jogável (local) | 8 / 15 | Liberada |
| D. Servidor e banco (Supabase) | 7 / 12 | Liberada |
| E. Estrutura e mercado (paralela) | 0 / 5 | Liberada |
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
| C2 | Energia regenera com o tempo (hoje o jogador trava sem energia). Pronto = teste automático + prova no localhost (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (regra do fundador: 7 min por ponto, teto 100; R-ENERGIA-1) |
| C3 | Corrigir erro de tipo em strike.ts:53 e criar script "typecheck" (o build não checa tipos) (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (npm run typecheck) |
| C4 | Trocar o nome para Mobster Rise (título, textos, criação de personagem); tirar "Goodgame Gangster" do que o jogador vê (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11 (título e criação; chave do save e comentários internos mantêm o nome antigo) |
| C5 | Ranking, Família e Eventos hoje são falsos: decidir o que o MVP mostra (NPCs assumidos) e implementar (nível 1) | FUNDADOR + CLAUDE | ✅ FEITO | Feito em 2026-11-11: NPCs assumidos (escolha do Claude, autorizada pelo fundador; pode trocar) |
| C6 | Balanceamento do início (duelo de nível 1 perdido; inimigo de missão com 935 de vida) usando o simulador | CLAUDE | ⏳ A FAZER | Depois de C2 |
| C7 | Tutorial mínimo e teste de 30 a 60 minutos seguidos sem erro nem beco sem saída | CLAUDE | ⏳ A FAZER | Depois de C2, C4, C5 e C6 |
| C8 | Atualizar o README (descreve só a Fase 1) | CLAUDE | ⏳ A FAZER | Depois de C7 |
| C9 | Dependências com alerta no npm audit (zod alto; tinypool crítico): atualizar em cópia isolada com testes | CLAUDE | ⏳ A FAZER | Adiado para o início de D2 (zod passa a validar dado de fora); risco atual baixo, ver DECISOES.md |
| C11 | Margem preta em % no desktop (feita e depois REVOGADA pelo fundador em 2026-11-11: voltou a tela inteira, R-LAYOUT-5); abas em 2 linhas mantidas (nível 1) | CLAUDE | ✅ FEITO | Feito em 2026-11-11: medido de 1024 a 2560 px (6% de cada lado) |
| C10 | Layout do jogo no celular: a página transborda na horizontal (413 px numa tela de 390). Pronto = sem rolagem lateral em 360 a 430 px | CLAUDE | ⏳ A FAZER | Antes de divulgar; achado em 2026-11-11 (já existia antes do login) |
| C13 | Botão "Personalizar Visual do Gangster" do perfil não faz nada: reaproveitar o criador novo para mudar o visual depois (decidir se custa algo) | CLAUDE | ⏳ A FAZER | Achado em 2026-11-11; depois de C10 |
| C15 | Novo estilo de personagem (rosto com volume, menos "boneco") e mais personalização: olhos, sobrancelhas, nariz, boca, orelhas, cabelo, óculos, cicatriz, charuto etc. Prévia interativa mostrada em 2026-11-11; aguarda aprovação do estilo antes de implementar. Inclui redesenhar trajes, mulheres e as poses de combate (atacar, tomar dano, esquivar) (nível 0) | FUNDADOR + CLAUDE | ❌ BLOQUEADA | EM ESPERA (decisão do fundador em 2026-11-11: mexer depois). Protótipo guardado em prototipos/rosto-v1. Falta decidir a fonte da arte: A artista, B kit licenciado |
| C16 | Armas: dano mínimo e máximo sempre à vista, comparação ao passar o mouse, espaço da arma abaixo do personagem e arrastar e soltar (trocar e guardar) (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11; provado no localhost e no site da Vercel (comprar, arrastar para trocar), com a conta de teste apagada |
| C17 | Comparação de armas sempre (defeito do balão após trocar arrastando corrigido), painel de atributos compacto com balão de influência e mochila de 10 espaços (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11; provado no localhost e no site da Vercel (trocar arrastando e o balão aparece), com a conta de teste apagada |

### Etapa D: Servidor e banco (Supabase)

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| D2e | Fluxo de entrada em 3 telas (Entrar / Crie seu personagem / Sua conta) com criador de variedade real: o jogador monta o personagem, nada é sorteado (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11: provado no localhost e também no site da Vercel (conta criada pelo fluxo, personagem escolhido no save, sair e entrar), com a conta de teste apagada |
| D0a | Criar conta e projeto no Supabase (2FA), rodar a migração 001 no SQL Editor e colocar as chaves em .env.local e na Vercel. Nunca no chat (passo a passo no chat) (nível 2) | FUNDADOR | ✅ FEITO | Feito em 2026-11-11: variáveis VITE_ na Vercel confirmadas no site no ar. A chave secreta fica fora da Vercel até a etapa D2c |
| D1 | Arquitetura Supabase (docs/arquitetura/BANCO_DE_DADOS.md) com cenários de custo e recomendação (nível 0) | CLAUDE + FUNDADOR | ✅ FEITO | Aprovado em 2026-11-11 com as recomendações (login e-mail e senha primeiro; Google depois; saves locais descartados; lógica nas funções da Vercel) |
| D2a | Migração 001 (tabela de jogadores, RLS, visão pública) em supabase/migrations. Pronto = rodou no projeto real e o teste de RLS prova que um jogador não lê nem grava dado de outro (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11: 15 de 15 verificações de segurança passaram no banco real (npm run test:rls) |
| D2b | Criar conta e entrar (e-mail e senha) dentro do jogo; sem as chaves o jogo segue em modo local (nível 2) | CLAUDE | ✅ FEITO | Feito em 2026-11-11: provado no localhost e também no site da Vercel (criar conta, sair, senha errada, entrar, personagem restaurado), com a conta de teste apagada no fim |
| D2c | Personagem e progresso salvos no banco por função do servidor (Vercel), nunca direto do navegador; nome único; uma conta um personagem (nível 1) | CLAUDE | ✅ FEITO | Código e testes automáticos prontos (banco de mentira). Falta provar com o banco real: depende de D2c-sql e D2c-secret |
| D2d | Ranking real e duelo entre jogadores reais (servidor luta e paga; duelo não gasta energia) (nível 1) | CLAUDE | ✅ FEITO | Código e testes automáticos prontos. Falta provar com o banco real e com duas contas no navegador |
| D2 | Ações do jogo (missões, duelos, loja, drops, energia) decididas no servidor, à prova de trapaça | CLAUDE | ⏳ A FAZER | Depois de D2c; antes de qualquer pagamento |
| D3 | Famílias reais (jogadores de verdade) | CLAUDE | ⏳ A FAZER | Depois de D2d |
| D4 | Antifraude do produto: limites, rate limit, auditoria de transações, contas duplicadas | CLAUDE | ⏳ A FAZER | Depois de D2, antes de abrir ao público |
| D2c-sql | Colar a migração 002 (supabase/migrations/002_duelos_e_ranking.sql) no SQL Editor do Supabase e rodar | FUNDADOR | ⏳ A FAZER | Agora; sem ela o ranking e o duelo não funcionam |
| D2c-secret | Criar na Vercel a variável SUPABASE_SERVICE_ROLE_KEY como Secret (valor igual ao do .env.local), em Production, e redeploy. Nunca no chat | FUNDADOR | ⏳ A FAZER | Antes de eu publicar; sem ela o site fica em modo local com aviso |

### Etapa E: Estrutura e mercado (paralela)

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| E1 | Busca de marca "Mobster Rise" e registro de domínio | FUNDADOR | ⏳ A FAZER | Em paralelo; antes de divulgar |
| E2 | Termos de uso e política de privacidade (exigidos ao criar conta); classificação 14+. Revisão profissional a confirmar | FUNDADOR | ⏳ A FAZER | Em paralelo; antes de abrir cadastro |
| E3 | Escolher meio de pagamento (adulto responsável paga) e política de estorno | FUNDADOR + CLAUDE | ⏳ A FAZER | Depois de D2 |
| E5 | Esqueci a senha (recuperar por e-mail): depende de E4 (envio de e-mail do Supabase) | CLAUDE | ⏳ A FAZER | Depois de E4 |
| E4 | Antes de abrir ao público: ligar a confirmação de e-mail no Supabase, configurar o e-mail de envio e a URL do site (Authentication) | FUNDADOR + CLAUDE | ⏳ A FAZER | Antes de divulgar; hoje a confirmação está desligada só para testes |

### Etapa F: Lançamento e receita

| ID | Tarefa | Dono | Estado | Quando |
|---|---|---|---|---|
| F1 | Teste fechado com poucos jogadores e coleta de feedback | FUNDADOR + CLAUDE | ⏳ A FAZER | Depois de C7 |
| F2 | Divulgação nostálgica (lista de espera, comunidades) só com demonstração real | FUNDADOR | ⏳ A FAZER | Depois de F1 |
| F3 | Loja paga ativa (pay to win com limite definido pelo simulador) | CLAUDE | ⏳ A FAZER | Depois de D2, D4 e E3 |
