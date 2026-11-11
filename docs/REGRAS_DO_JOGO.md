# Regras do jogo (registro oficial)

Cada regra do Mobster Rise fica aqui, com valor, quem decidiu, onde está no código e qual teste a protege. Fica no repositório (git), então tem histórico e backup. Uma regra só muda com decisão do fundador, e a mudança atualiza este arquivo, `DECISOES.md` e o teste.

**Como registrar uma regra nova:** acrescente uma linha na tabela certa com um ID `R-ASSUNTO-n`, o valor, quem decidiu, a data, o arquivo do código e o teste. Se não houver teste, escreva "sem teste" (vira tarefa no plano).

Legenda de "Origem": **Fundador** = você decidiu. **Claude** = eu propus e você ainda não confirmou. **Existente** = já estava no código e ninguém decidiu formalmente.

## Energia

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-ENERGIA-1 | Regeneração por tempo | **1 ponto a cada 7 minutos (420 s)**; teto **100**; 100 pontos do zero levam 11h40 | Fundador, 2026-11-11 | `src/web/energy.ts` (`ENERGY_SECONDS_PER_POINT`), `maxEnergy` em `src/web/state.ts` | `tests/unit/energy.test.ts` |
| R-ENERGIA-2 | Regenera com o jogo fechado | Ao abrir o jogo, credita o tempo que passou | Claude, 2026-11-11 (a confirmar) | `state.ts` (`tickEnergy`) | `energy.test.ts` |
| R-ENERGIA-3 | Energia cheia para o contador | Ao gastar a partir de 100, o contador começa naquele instante | Claude, 2026-11-11 (a confirmar) | `state.ts` (`consumeEnergy`) | provado no localhost; sem teste automático |
| R-ENERGIA-4 | Bônus de Família | Acelera a regeneração em % (Corleone 15, Gambino 10, Luciano 20) | Existente (valores já estavam nos dados) | `gameData.ts`, `state.ts` | `energy.test.ts` (conta do bônus) |
| R-ENERGIA-5 | Recarga instantânea | 5 Ouros enchem a energia | Existente | `main.ts` (botão de recarga) | sem teste |
| R-ENERGIA-6 | Subir de nível enche a energia | Cheia ao subir de nível | Existente | `state.ts` (`addXp`) | sem teste |
| R-ENERGIA-7 | Custos de energia | Missões: 15, 20, 25, 30, 35, 40. Duelo: 10. Chefão: 25 | Existente | `gameData.ts`, `main.ts` | sem teste |

Observação: com 7 minutos por ponto, uma missão de 15 energia custa 1h45 de espera. Isso aperta o ritmo e favorece quem compra recarga. O balanceamento (C6) vai medir se o início continua divertido.

## Ranking, Família e Eventos (MVP)

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-NPC-1 | Famílias e Chefão do evento são NPCs no MVP e dizem isso na tela. **O ranking e os rivais do duelo agora são jogadores reais quando há servidor** (R-RANKING-1); sem servidor (modo local) continuam NPCs | Aviso visível nas telas de NPC; rival NPC marcado "NPC" | Claude, 2026-11-11 (autorizado pelo fundador); atualizada em 2026-11-11 | `index.html`, `src/web/main.ts` | provado no localhost; sem teste automático |
| R-RANK-1 | Posição do jogador (modo local) | Contada entre os NPCs por Respeito; em empate, o NPC fica acima. Com servidor vale a R-RANKING-1 | Claude, 2026-11-11 (a confirmar) | `main.ts` (`renderNpcRankingView`) | provado no localhost; sem teste automático |
| R-RANK-2 | ~~Ranking real só com servidor~~ **FEITO** na R-RANKING-1 | n/a | Claude | n/a | n/a |

## Dinheiro e loja

| ID | Regra | Valor | Origem | Onde | Teste |
|---|---|---|---|---|---|
| R-LOJA-1 | Sem lootbox | Só loja e drops em missões, lutas com chefões e wanted | Fundador, 2026-11-11 | produto (sem código ainda) | n/a |
| R-LOJA-2 | Pay to win moderado | Itens pagos dão vantagem, com limite a definir pelo simulador (C6) | Fundador, 2026-11-11 | a implementar (F3) | n/a |
| R-PAGAMENTO-1 | Quem paga | Adulto responsável, com o próprio meio de pagamento, via provedor. O jogo não cobra menor | Fundador, 2026-11-11 | a implementar (E3) | n/a |

## Banco de dados (regras de processo)

| ID | Regra | Valor | Origem | Onde | Teste |
|---|---|---|---|---|---|
| R-SQL-1 | Migrações numeradas em ordem | Arquivos `supabase/migrations/NNN_descricao.sql` (001, 002, ...), sem pular número. O número aparece no **início** e no **fim** do arquivo: `-- ===== INICIO DA MIGRACAO NNN (arquivo) =====` e `-- ===== FIM DA MIGRACAO NNN (arquivo) =====` | Fundador, 2026-11-11 | `supabase/migrations/` | `tests/unit/migrations.test.ts` |
| R-SQL-2 | Migração já rodada não se edita | Para mudar algo, cria-se a próxima (002, ...). Exceção: só comentário/marcador, que não altera o banco | Claude, 2026-11-11 (a confirmar) | `supabase/migrations/` | sem teste |
| R-SQL-3 | Quem aplica | O fundador cola cada migração no SQL Editor, na ordem, e avisa "Success" ou o erro | Claude, 2026-11-11 (a confirmar) | processo | n/a |

## Contas

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-CONTA-1 | Senha | Mínimo de 8 caracteres ao criar conta | Claude, 2026-11-11 (a confirmar) | `src/web/authRules.ts` | `tests/unit/auth.test.ts` |
| R-CONTA-2 | Save por conta | Cada conta tem o próprio save no navegador (chave `gangster_rpg_save_v1_<id da conta>`); contas no mesmo computador não se misturam | Claude, 2026-11-11 (a confirmar) | `src/web/saveKey.ts`, `state.ts` (`setAccount`) | `auth.test.ts` + provado no localhost |
| R-CONTA-3 | Conta obrigatória quando há Supabase | Com as chaves configuradas, o jogo exige entrar. Sem as chaves, abre em modo local como antes. Não existe botão para "pular" o login | Claude, 2026-11-11 (a confirmar) | `src/web/main.ts` (`boot`), `supabaseClient.ts` | provado no localhost |
| R-CONTA-4 | Confirmação de e-mail | Desligada só durante os testes. Tem de ser ligada antes de abrir ao público (E4) | Fundador (desligar nos testes), 2026-11-11 | painel do Supabase | sem teste |
| R-CONTA-5 | Saves locais antigos | Não são migrados para a conta (decisão D1: descartar) | Fundador, 2026-11-11 | n/a | n/a |

## Entrada e personagem

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-FLUXO-1 | Fluxo de entrada em 3 telas | **Entrar** (padrão ao abrir) com botão grande "Novo por aqui?"; **Crie seu personagem**; **Sua conta** (nome, e-mail, senha). Ao criar a conta, o personagem montado já vem com ela e o jogo abre direto. Referência: só o fluxo de um jogo do gênero; nenhuma arte, logo ou texto de terceiros | Fundador, 2026-11-11 | `index.html`, `src/web/authUi.ts`, `onboarding.ts` | provado no localhost com conta real |
| R-FLUXO-2 | Conta sem personagem e modo local | Quem já tem conta mas não tem personagem, e o modo sem Supabase, passam por "Crie seu personagem" e depois só pelo nome (sem e-mail e senha) | Claude, 2026-11-11 (a confirmar) | `authUi.ts` (`startCharacterCreation`) | provado no localhost |
| R-FLUXO-3 | "Esqueci a senha" | Ainda não existe; depende do envio de e-mail do Supabase (E4/E5) | Claude, 2026-11-11 | n/a | n/a |
| R-PERSONAGEM-1 | O personagem é **montado pelo jogador**, nada é sorteado | Opções (por gênero): **tom de pele 8**, **penteados 7 (masc.) e 5 (fem.)**, **cor do cabelo 10**, **olhos 8**, **barbas 7** (só masc.), **trajes 6 (masc.) e 7 (fem.)**, **cor do traje 10**, **chapéus 4**, **acessórios 9 (masc.) e 8 (fem.)**, **fundo 4**, mais **3 classes e 3 armas**. Dá **270.950.400** combinações de visual (masc.) e **28.672.000** (fem.). Cada opção tem desenho próprio | Fundador (pediu variedade e que não fosse aleatório), 2026-11-11; lista do Claude | `src/web/characterOptions.ts`, `paperdoll.ts`, `onboarding.ts` | `tests/unit/characterOptions.test.ts` |
| R-PERSONAGEM-2 | Nome do personagem | 3 a 24 caracteres; só letras (com acento), números, espaço e `. ' " - _`; sem HTML. Nome **único** só será garantido com o banco (D2c) | Claude, 2026-11-11 (a confirmar) | `src/web/authRules.ts` | `characterOptions.test.ts` |
| R-PERSONAGEM-3 | A classe não muda o visual | Escolher Carrasco, Muralha ou Malandro não altera a aparência montada (antes trocava o visual inteiro) | Claude, 2026-11-11 | `onboarding.ts` | provado no localhost |
| R-PERSONAGEM-4 | Chapéu e acessório são escolhas separadas | O campo `hat` é novo; saves antigos com `accessory: fedora` continuam mostrando o chapéu | Claude, 2026-11-11 | `paperdoll.ts` | `characterOptions.test.ts` |

## Armas e espaço da arma

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-ARMA-1 | **Dano mínimo e máximo sempre à vista** | Em todo lugar onde aparece uma arma (espaço da arma, mochila, cartão de detalhes, loja, balão) mostra o dano, por exemplo `12 mín – 22 máx` (na mochila, curto: `12–22`) | Fundador, 2026-11-11 | `src/web/weaponSlot.ts`, `src/web/main.ts` | `tests/unit/weaponSlot.test.ts` (toda arma do catálogo tem mín e máx válidos) |
| R-ARMA-2 | **Comparação ao passar o mouse, SEMPRE** | Balão com mínimo, máximo e média: equipada × esta × diferença (+/−) e um veredito (mais dano, menos dano, igual, misto). Vale na mochila, na loja e no cartão de detalhes, com arma equipada ou desarmado, **inclusive depois de trocar a arma arrastando** (defeito corrigido em 2026-11-11: depois de uma troca arrastando o balão parava de aparecer) | Fundador (pediu comparar; depois pediu "SEMPRE"); formato do Claude | `src/web/weaponSlot.ts` (`compareWeapons`), `src/web/main.ts` (`endWeaponDrag`) | `weaponSlot.test.ts` (conta); o defeito do balão só aparece no navegador: provado com o código antigo (balão sumia) e o novo (balão aparece) |
| R-ARMA-3 | **Espaço da arma abaixo do personagem, com arrastar e soltar** | Arrastar uma arma da mochila até o espaço da arma **troca** (a antiga volta para a mochila). Arrastar a arma equipada para a mochila a **guarda**. A arma equipada não aparece na mochila. Os botões "Guardar na mochila" e "Equipar" fazem o mesmo (celular não tem arrastar com o dedo) | Fundador, 2026-11-11 | `index.html`, `src/web/main.ts`, `src/web/state.ts` (`equipWeaponFromBag`, `unequipWeapon`) | `weaponSlot.test.ts` + provado no navegador com arrastar de verdade |
| R-ARMA-4 | **Sem arma = punhos** | Guardar a arma deixa o personagem desarmado: luta com os **Punhos** (dano 0 a 0, só o Ataque base causa dano). Os Punhos não são vendidos nem são item | Claude (consequência de "ela sai"), 2026-11-11 (a confirmar) | `src/engine/weapons.ts` (`FISTS`), `src/web/weaponSprites.ts` | `weaponSlot.test.ts` (inclui luta de mãos vazias) |
| R-ARMA-5 | **Arma nova só se equipa sozinha com o espaço vazio** | Comprar ou ganhar arma (drop) manda para a mochila; o jogador arrasta para equipar. Antes, toda arma nova trocava a equipada sozinha | Claude, 2026-11-11 (a confirmar) | `src/web/state.ts` (`buyItem`) | `weaponSlot.test.ts` |
| R-ARMA-6 | ~~A mochila cresce além de 12 espaços~~ **SUBSTITUÍDA** pela R-MOCHILA-1 | A mochila agora tem capacidade 10 | Fundador, 2026-11-11 | `weaponSlot.ts` | `weaponSlot.test.ts` |

## Atributos e mochila

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-ATRIB-1 | **Painel de atributos compacto, ao lado do personagem, sem emojis** | O painel antigo (grande, com emojis e textos longos) virou uma lista pequena ao lado do personagem: nome do atributo, **pontos** e os botões de +1 e Treinar. Sem emojis. O resumo de armadura, esquiva, bônus de crítico e passivas ficou compacto embaixo | Fundador, 2026-11-11 | `index.html`, `src/web/style.css`, `src/web/main.ts` | provado no navegador (1.101 a 1.440 px; 1 coluna abaixo de 1.100 px) |
| R-ATRIB-2 | **Balão com o que cada atributo influencia** | Ao passar o mouse: **Ataque** mostra o dano base, **Vida** o HP máximo, **Astúcia** a chance de crítico e **Tenacidade** a redução do crítico sofrido, e quanto **cada ponto a mais** acrescenta. Usa a mesma conta do motor de combate, então nunca difere da luta. No teto de 50% avisa que mais pontos não ajudam | Fundador, 2026-11-11; formato do Claude | `src/web/attributeInfluence.ts`, `main.ts` | `tests/unit/attributeInfluence.test.ts` |
| R-MOCHILA-1 | **A mochila cabe 10 itens no começo (5 por linha)** | Capacidade inicial **10**, em 2 linhas de 5, guardada no save (`bagCapacity`) para poder ser ampliada no futuro (a ampliação ainda não existe). A arma no espaço da arma **não ocupa** a mochila. Cheia (10/10): comprar é recusado, guardar a arma é recusado e o drop de missão é perdido, **sempre com aviso**. A troca de arma arrastando continua valendo com a mochila cheia. Saves antigos com itens a mais mostram todos, mas não recebem mais nada | Fundador (10 itens); consequências do Claude (a confirmar) | `weaponSlot.ts`, `state.ts` (`buyBlockReason`, `bagHasRoom`), `main.ts` | `weaponSlot.test.ts` |
| R-LOJA-3 | **A compra confere tudo antes de cobrar** | Nível, ouro, cash e espaço na mochila são conferidos **antes** de gastar. Antes, faltando cash o ouro já tinha sido cobrado e perdido | Claude, 2026-11-11 (defeito corrigido) | `state.ts` (`buyItem`) | `weaponSlot.test.ts` |

## Servidor, ranking e duelo

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-SERVIDOR-1 | **Só o servidor escreve no banco** | O navegador nunca grava em `players` nem em `duels` (o banco recusa, por RLS). Quem grava é a função `/api/game` (Vercel) com a chave service_role, guardada só como Secret e no `.env.local`. Nunca no repositório nem no navegador | Fundador (opção B), 2026-11-11 | migrações 001 e 002, `src/server/*`, `api/game.ts`, `vite.config.ts` (só no `npm run dev`) | `supabase/tests/rls-check.mjs`; `tests/unit/server.test.ts` |
| R-SERVIDOR-2 | **Uma conta, um personagem; nome único** | O personagem nasce do zero no servidor (com o nome, a classe, a arma inicial e o visual escolhidos). Nome único sem diferenciar maiúscula de minúscula; nome em uso volta ao passo do nome com aviso. Com servidor, "Novo Gangster" fica desligado (para criar outro, outra conta) | Fundador (nome único, D2c); consequência do Claude | `src/server/rules.ts` (`buildNewPlayer`), `handlers.ts` (`opCreate`), índice `players_name_lower_uidx`, `main.ts` | `server.test.ts` (nome único, uma conta um personagem, dados inválidos) |
| R-SERVIDOR-3 | **O servidor confere o progresso que o navegador manda** | Coerência: pontos fecham com o nível, XP cabe no nível, itens existem no catálogo (vale o dado do catálogo, não o do navegador), arma equipada está na mochila. Ritmo (valores de partida, a calibrar): nível máximo = 2 + 0,5 por minuto de vida do personagem; missões = 5 + 1 por minuto; ouro nunca passa de 25; cash limitado por missões, nível e prêmios de duelo. Nome, classe, aparência e placar V/D **nunca** vêm do navegador. Recusado: o navegador volta ao save do servidor e avisa. **É um freio de ritmo, não uma parede:** missões, loja e treino ainda são calculados no navegador (tarefa D2 move isso ao servidor) | Fundador (opção B); valores do Claude (a confirmar) | `src/server/rules.ts` (`LIMITS`, `validateSave`) | `server.test.ts` |
| R-SERVIDOR-4 | **Sem servidor, joga só neste navegador** | Se a função do servidor não responde (fora do ar, ou Secret ainda não configurado), o jogo abre em modo local com aviso na tela; o personagem não aparece no ranking nem duela | Claude, 2026-11-11 (a confirmar) | `main.ts` (`onLoggedIn`, `setOfflineNotice`) | provado no navegador |
| R-RANKING-1 | **Ranking real por Respeito** | Top 50 jogadores reais, por Respeito; empate: o personagem mais antigo fica acima. Mostra classe, nível, família, Respeito e vitórias/derrotas. Lê só a visão pública (`public_players`), nunca o save. Atualiza a cada 20 s ao abrir a aba e depois de cada duelo | Fundador, 2026-11-11 | `main.ts` (`renderRankingView`), `cloudSync.ts` (`fetchRanking`), migração 002 | `rls-check.mjs` (visão sem dados privados); provado no navegador |
| R-DUELO-1 | **Duelo contra jogador real, com o rival offline** | Você luta contra os atributos e a arma que o rival tem salvos no servidor. O **servidor** roda a luta (semente dele) e devolve o replay; o navegador só reproduz. O mesmo motor das missões | Fundador, 2026-11-11 | `rules.ts` (`resolveDuel`, `combatInputOf`), `handlers.ts` (`opDuel`), `main.ts` (`challengeRealRival`) | `server.test.ts` (vence/perde, mesma semente = mesmo duelo) |
| R-DUELO-2 | **Duelo não gasta energia** | Custo 0. Vale também para os rivais NPC do modo local (antes custavam 10) | **Fundador, 2026-11-11** | `main.ts` (sem `consumeEnergy`), `handlers.ts` | `server.test.ts` ("duelo não gasta energia") |
| R-DUELO-3 | **Prêmio e perda** | Vence: +$(80 + 45 × nível do rival), pagos pelo servidor; +25 Respeito; +60 XP. Perde: −10 Respeito (nunca abaixo de 0); nada mais. **Quem é desafiado não perde nada** (nem Respeito, nem cash): só o placar V/D muda | Claude, 2026-11-11 (**provisório**: o fundador mandou pular o cálculo por ora; ver R-DUELO-6) | `src/shared/duel.ts` (`DUEL`), `rules.ts` | `server.test.ts` |
| R-DUELO-4 | **Duela com qualquer um; limites contra abuso** | **Sem faixa de nível: pode duelar com qualquer jogador**, de qualquer nível. Continuam: mínimo de 10 minutos para desafiar o MESMO rival de novo (**confirmado pelo fundador**); no máximo 30 duelos por hora por jogador (Claude, a confirmar); não duela consigo mesmo. Cada duelo fica registrado na tabela `duels` | **Fundador, 2026-11-11** (sem faixa e espera de 10 min); Claude (30 por hora) | `src/shared/duel.ts`, `rules.ts` (`duelBlockReason`), migração 002 | `server.test.ts` ("duela com qualquer nível", espera) |
| R-DUELO-6 | **Prêmio de duelo por Ranking (a definir)** | Intenção do fundador: a fórmula de prêmio será baseada no **Respeito (ranking), não no nível**. Quem tem nível alto tem Respeito muito maior, então atacar um nível baixo rende pouco; quem tem Respeito baixo e vence alguém de Respeito muito maior ganha **muito** Respeito. **Ainda sem cálculo exato: o fundador mandou pular por ora.** Enquanto isso valem os valores provisórios de R-DUELO-3 | Fundador, 2026-11-11 (intenção; fórmula pendente) | — (ainda não implementado) | — |
| R-DUELO-5 | **Respeito de duelo é do servidor** | O Respeito ganho ou perdido em duelo é somado pelo servidor e o navegador não consegue desfazê-lo nem inflá-lo; o Respeito de missões segue conferido pelo ritmo (R-SERVIDOR-3) | Claude, 2026-11-11 | `rules.ts` (`validateSave`, `respect_duels`) | `server.test.ts` |

## Layout

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-LAYOUT-1 | ~~Margem preta do jogo no desktop (6% de cada lado)~~ **REVOGADA** | O fundador viu e disse que a tela inteira "estava melhor". Substituída pela R-LAYOUT-5 | Fundador, 2026-11-11 | (removida do `style.css`) | `layout.test.ts` garante que não volta |
| R-LAYOUT-1b | ~~Margem também na tela de login~~ **REVOGADA** | O login voltou a ocupar a tela de ponta a ponta, sem moldura | Fundador, 2026-11-11 | `style.css` | `layout.test.ts` |
| R-LAYOUT-2 | ~~Limite de 1440 px no desktop~~ **SUBSTITUÍDA** pela R-LAYOUT-5 (palco de 1672 px) | O #app agora tem no máximo 1672 px | Fundador, 2026-11-11 | `style.css` (#app) | `layout.test.ts` |
| R-LAYOUT-3 | Abas em 2 linhas quando faltar espaço | No desktop as 8 abas quebram em 2 linhas, nunca somem atrás de rolagem (mantida; o Perfil em 1 coluna foi removido junto com a margem) | Claude, 2026-11-11 (a confirmar) | `style.css` | `layout.test.ts` |
| R-LAYOUT-4 | Abaixo de 1024 px (tablet e celular) | Sem margem preta; o layout continua como antes | Claude, 2026-11-11 | `style.css` | medido em 768 px |
| R-LAYOUT-5 | **Palco do tamanho da imagem do login, preto em volta** | O jogo e o login têm no máximo o tamanho da imagem do login (**1672 x 941 px**). Em telas menores ocupam a tela toda. Em telas maiores o palco fica centralizado e o resto é **preto puro, sem borda, moldura nem sombra**. O fundo da página é preto. Substitui a margem de 6% (R-LAYOUT-1) e o limite de 1440 px (R-LAYOUT-2) | Fundador, 2026-11-11 | `src/web/style.css` (`body`, `#app`, `.auth-screen`, `.auth-frame`) | `tests/unit/layout.test.ts` (inclui conferir que a imagem mede 1672 x 941) |

## Produto

| ID | Regra | Valor | Origem | Onde | Teste |
|---|---|---|---|---|---|
| R-PUBLICO-1 | Público | 14 anos ou mais | Fundador, 2026-11-11 | produto | n/a |
| R-DADOS-1 | Onde ficam os dados dos jogadores | Banco de dados (Supabase), com servidor como fonte da verdade | Fundador, 2026-11-11 | a implementar (D2) | n/a |
| R-DADOS-2 | Coletar o mínimo de dados do jogador | Só o necessário para jogar e cobrar | Claude, 2026-11-11 (a confirmar) | a implementar (D2) | n/a |
