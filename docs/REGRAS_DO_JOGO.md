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
| R-NPC-1 | Ranking, Famílias e Chefão do evento são NPCs no MVP e dizem isso na tela | Aviso visível nas três telas; rival do ranking marcado "NPC" | Claude, 2026-11-11 (autorizado pelo fundador; pode trocar por esconder as abas) | `index.html`, `src/web/main.ts` | provado no localhost; sem teste automático |
| R-RANK-1 | Posição do jogador | Contada entre todos por Respeito; em empate, o NPC fica acima | Claude, 2026-11-11 (a confirmar) | `main.ts` (`renderRankingView`) | provado no localhost; sem teste automático |
| R-RANK-2 | Ranking real | Só com servidor (D3) | Claude | a implementar | n/a |

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

## Layout

| ID | Regra | Valor | Origem | Onde no código | Teste |
|---|---|---|---|---|---|
| R-LAYOUT-1 | Margem preta do jogo no desktop | O jogo não ocupa a tela toda: margem preta padrão em %, **igual em todo desktop** (a partir de 1024 px). Valor: **6% de cada lado** e 2% em cima e embaixo. Para mudar, só as variáveis `--game-margin` e `--game-margin-v` | Fundador (a regra); 6% e 2% escolhidos pelo Claude (a confirmar) | `src/web/style.css` (fim do arquivo) | `tests/unit/layout.test.ts` + medido no navegador de 1024 a 2560 px |
| R-LAYOUT-1b | A margem vale também na tela de login | A imagem do login fica numa moldura com a mesma margem (6% e 2%), com preto ao redor. Em celular (menos de 1024 px) a imagem continua de ponta a ponta | Fundador, 2026-11-11 (escolheu "A": mesma margem no login) | `index.html` (`.auth-frame`), `style.css` | `layout.test.ts` + medido de 1024 a 2560 px |
| R-LAYOUT-2 | Sem limite fixo de largura no desktop | A margem é sempre em %; em telas muito largas o jogo se estica junto | Claude, 2026-11-11 (a confirmar) | `style.css` | `layout.test.ts` |
| R-LAYOUT-3 | Abas em 2 linhas quando faltar espaço | Em desktops menores as 8 abas quebram em 2 linhas, nunca somem atrás de rolagem. Perfil vira 1 coluna até 1240 px | Claude, 2026-11-11 (a confirmar) | `style.css` | medido no navegador |
| R-LAYOUT-4 | Abaixo de 1024 px (tablet e celular) | Sem margem preta; o layout continua como antes | Claude, 2026-11-11 | `style.css` | medido em 768 px |

## Produto

| ID | Regra | Valor | Origem | Onde | Teste |
|---|---|---|---|---|---|
| R-PUBLICO-1 | Público | 14 anos ou mais | Fundador, 2026-11-11 | produto | n/a |
| R-DADOS-1 | Onde ficam os dados dos jogadores | Banco de dados (Supabase), com servidor como fonte da verdade | Fundador, 2026-11-11 | a implementar (D2) | n/a |
| R-DADOS-2 | Coletar o mínimo de dados do jogador | Só o necessário para jogar e cobrar | Claude, 2026-11-11 (a confirmar) | a implementar (D2) | n/a |
