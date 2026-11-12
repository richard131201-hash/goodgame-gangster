# STATUS: Mobster Rise

Fatos verificados em **2026-11-11**. Em conflito com outro documento, este prevalece.
Níveis: 0 maquete, 1 funciona local/fictício, 2 funciona no ambiente real com teste ponta a ponta, 3 em uso real e monitorado.

## O que é
Jogo de navegador de gângsteres, nostálgico (era Goodgame Gangster), meta de receita com pay to win moderado e sem lootbox. Público 14+. Banco previsto: Supabase.

## Fatos verificados

| Item | Fato | Como verifiquei |
|---|---|---|
| Testes | 9 arquivos, 61 testes, todos passam (10 novos de energia) | `npx vitest run` |
| Build | Funciona (vite, 32 módulos) | `npm run build` |
| Tipos | **1 erro** em `src/engine/strike.ts:53` (`openingStrike` não existe em todos os estilos). O build não checa tipos, então passa | `npx tsc --noEmit` |
| Dependências | `npm audit`: 4 vulnerabilidades (1 moderada, 1 alta, 2 críticas). Alta: `zod` (runtime). Críticas/moderada: pacotes de teste (`tinypool`, `@vitest/mocker`) | `npm audit` |
| Site no ar | https://mobster-rise.vercel.app/ abre e mostra a criação de personagem. Título: "SUBMUNDO — Gangster RPG (Estilo Goodgame Gangster)" | Navegador |
| Git | Remoto `origin` no GitHub; Vercel publica a cada push (informado pelo fundador, não verificado no painel) | `git remote -v` |
| Salvamento | Só `localStorage` do navegador (`state.ts`, chave `gangster_rpg_save_v1`). Sem servidor nem banco | Código |
| Aleatoriedade no cliente | Drops de missão e seed das lutas usam `Math.random()` no navegador (`main.ts:478`, `main.ts:962`) | Código |
| Ranking | Lista fixa escrita no código (`main.ts:706`). Não há outros jogadores | Código |
| Família | Falsa: entrar e doar só alteram o save local | Código |
| Energia | **Corrigido (C2):** regenera 1 ponto a cada **7 minutos** (regra do fundador, R-ENERGIA-1), teto 100, inclusive com o jogo fechado, e o bônus de Família acelera. HUD mostra a contagem ao passar o mouse. Provado no localhost simulando 10 min fora (50 para 55) e gasto a partir de energia cheia | `tests/unit/energy.test.ts` + jogo |
| Tipos | **Corrigido (C3):** `npm run typecheck` passa sem erros | `tsc --noEmit` |
| Nome | **Corrigido (C4):** título da aba e tela de criação dizem "Mobster Rise". Comentários internos e a chave do save ainda têm o nome antigo (jogador não vê) | `index.html` |

## Banco de dados (2026-11-11)
- **Verificado no banco real em 2026-11-11 (nível 2):** projeto Supabase existe; tabela `players` e visão `public_players` existem; `npm run test:rls` passou **15 de 15** com dois usuários de teste (apagados no fim): visitante sem login não lê nada; jogador lê só a própria linha completa; vê os outros só pela visão pública, sem o campo `save`; não consegue alterar, criar nem apagar jogador direto (erro 403); dados intactos; limpeza completa.
- Chave pública no formato novo (`sb_publishable_`), aceita pelo Supabase. Chave secreta no formato novo (`sb_secret_`), sem prefixo `VITE_`. Valores nunca foram exibidos.
- Login por e-mail está ligado e a confirmação de e-mail está desligada (só para testes).
- **Não verificado:** as variáveis da Vercel (sem acesso ao painel); o login pelo jogo (a tela ainda não existe); backups do plano.
- `supabase/migrations/001_players.sql` escrito (tabela `players`, RLS, visão `public_players`). O fundador disse ter rodado no Supabase (salvo lá como "001"); **eu ainda não verifiquei no banco**. Não há Supabase CLI, Docker nem Postgres neste computador, então só dá para provar no projeto real.
- `.gitignore` não ignorava `.env`; corrigido e provado com `git check-ignore`.
- O Supabase mostrará um alerta de "Security Definer View" para `public_players`. É intencional: a visão expõe só colunas públicas.

## Contas (D2b, 2026-11-11)
Provado no localhost contra o Supabase real (nível 1 no site; as contas de teste foram apagadas, 0 contas e 0 linhas em `players` no fim):
- Criar conta pela tela (digitando) cria o usuário de verdade no banco (confirmado pela API de administração).
- Sair, entrar com senha errada ("E-mail ou senha incorretos."), entrar certo e voltar ao mesmo personagem.
- E-mail repetido é recusado ("Já existe uma conta com esse e-mail").
- Segunda conta no mesmo navegador não herda o personagem da primeira (save por conta).
- Sessão persiste ao recarregar a página (não pede login de novo).
- Validações em português (e-mail vazio, inválido, senha curta). 10 testes automáticos novos (`auth.test.ts`).
- A chave secreta **não** está no pacote do navegador (busca pelo valor real: não encontrado). O texto `sb_secret_` aparece só como código da biblioteca.
- Os 2 erros de console (400 e 422) eram dos testes negativos de propósito.
- **Achado:** o jogo transborda na horizontal no celular (413 px numa tela de 390). Já existia antes; tarefa C10.
- **Site no ar (Vercel), verificado em 2026-11-11 (nível 2):** depois de criar as 2 variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Config, Production) e dar Redeploy sem cache, o pacote do site contém a URL e a chave pública, e **não** contém a chave secreta. A tela de login aparece; criei uma conta de teste no site no ar, saí, errei a senha, entrei de novo e o personagem voltou. A conta foi apagada (0 contas no banco). A chave secreta **não está na Vercel** (só entra em D2c).
- **Ainda não verificado:** celular real; confirmação por e-mail; recuperação de senha (não existe).

## Entrada e criador de personagem (2026-11-11)
Provado no localhost contra o Supabase real (nível 1 no site até a conferência no ar; contas de teste apagadas, 0 contas no fim):
- **Fluxo:** Entrar → "Novo por aqui?" → Crie seu personagem (6 abas: Corpo, Cabelo, Rosto, Roupa, Extras, Classe e arma) → Sua conta (nome, e-mail, senha) → jogo abre com o personagem escolhido. Conferi no save da conta: gênero, penteado, traje, chapéu, acessório, fundo, classe, arma e nome batem com o que foi escolhido.
- **Validações:** nome vazio, curto (< 3), com HTML (`<b>x</b>`) e com símbolos recusados; e-mail inválido e senha curta recusados; "Voltar" mantém o personagem montado.
- **Sair e entrar de novo** devolve o mesmo personagem; senha errada mostra "E-mail ou senha incorretos."
- **Conta sem personagem** (apaguei só o save da conta): aparece "Sair da conta", o criador, e depois pede só o nome. Bigode de guidão escolhido apareceu no perfil.
- **Modo local** (Supabase desligado de propósito numa segunda instância): abre direto no criador, sem login, só o nome no fim, e o jogo abre.
- **Layout:** celular (390 px) sem rolagem lateral e cartão dentro da tela; 1024 px com margem de 6% e cartão dentro da moldura.
- **Variedade:** 270.950.400 combinações de visual (masc.) e 28.672.000 (fem.). Teste automático prova que **nenhuma opção cai no desenho de outra** (antes só 3 trajes eram distintos e "ondas" saía igual a "desgrenhado").
- **Pendências achadas:** o botão "Personalizar Visual do Gangster" do perfil não faz nada (sem função no código) → tarefa C13. "Esqueci a senha" não existe → E5. Nome único só com o banco (D2c). A pasta `C:\RODRIG~1` foi criada por mim por engano (arquivo de teste de 2 bytes) e a remoção foi bloqueada por segurança: o fundador precisa apagar.
- **Site no ar (Vercel), verificado em 2026-11-11 (nível 2):** repeti o fluxo inteiro em https://mobster-rise.vercel.app/ (Novo por aqui → personagem com cacheado, van dyke, jaqueta de couro, chapéu coco, monóculo, fundo Porto, Muralha → conta → jogo; depois sair e entrar). Save da conta bateu com as escolhas, margem do jogo 6%, nenhum erro de console. Conta de teste apagada (0 contas).
- **Não verificado:** celular real, Safari/Firefox, leitor de tela.

## Armas (2026-11-11)
- Provado no localhost (conta real, depois apagada): o espaço da arma fica **abaixo do personagem** com "Dano: 12 mín – 22 máx"; a mochila mostra o dano de cada arma (8–16, 18–32, 22–42); a loja também. O balão compara com a equipada (Tommy Gun contra a Colt: mín +6, máx +10, média +8). **Arrastar de verdade** funcionou nos dois sentidos: da mochila para o espaço (troca, e a antiga volta à mochila) e do espaço para a mochila (fica desarmado). Luta desarmado funciona (missão cumprida, sem erro). Os botões "Equipar" e "Guardar na mochila" funcionam como alternativa. O estado fica salvo.
- **Site no ar (Vercel), verificado (nível 2):** criei conta de teste, o espaço da arma aparece abaixo do personagem com o dano, comprei um Revólver (a Colt continuou equipada) e arrastei o Revólver até o espaço: ele equipou e a Colt voltou à mochila. Conta apagada.
- 25 testes novos (`weaponSlot.test.ts`), total 130.
- **Pendências:** armadura e acessório ainda não têm arrastar; no celular só funciona pelos botões (arrastar com o dedo não existe); a arma só aparece na mão do personagem quando está equipada.

## Servidor, ranking e duelo (D2c e D2d, 2026-11-11)
- **Nível 2 (2026-11-11):** migração 002 rodada pelo fundador e Secret criado na Vercel. O teste `supabase/tests/server-e2e.mjs` passou 21 de 21 no localhost e no site no ar, contra o banco real. No navegador (localhost), com 2 contas: o personagem foi criado pelo servidor, o ranking mostrou os dois, o duelo abriu o replay, o Respeito caiu de 120 para 110 na derrota, o placar foi para 0V/1D e 1V/0D, e a energia ficou em 100/100. Contas de teste apagadas. Não visto: celular e duelo vencido pela tela.
- **Escrito e testado antes só com banco de mentira:** `src/server/` (regras, operações, ligação com o Supabase), `api/game.ts` (função da Vercel), `vite.config.ts` (mesma função no `npm run dev`), `src/shared/` (contas do jogador e do duelo usadas pelo jogo e pelo servidor), `src/web/cloudSync.ts` (salvar com espera, ranking, rivais, duelo) e a **migração 002** (colunas de placar, tabela `duels`, visão `public_players` com placar e arma).
- **Funciona assim:** ao entrar, o servidor diz se a conta tem personagem. Sem personagem, o jogo abre a criação e o servidor cria (nome único). Com personagem, o save do servidor vale. A cada mudança o jogo manda o progresso ao servidor (espera de 1,5 s); o servidor confere e recusa exageros. Duelo: o servidor luta e devolve o replay. Se a função do servidor não responde, o jogo avisa e roda só neste navegador.
- **Contas que já existiam:** o save local delas não é enviado (não dá para provar que é honesto); ao entrar com migração e Secret prontos, a conta cria o personagem de novo.
- **Arte das armas (2026-11-12):** 5 armas do fundador (Colt, Winchester, Thompson, BAR, Springfield) e o chapéu de Missões recortados e ligados (painel da Arma, Mala, loja e balões). Springfield M1903 é arma nova (dano 30–54 provisório). Na mão do personagem e na arena segue o desenho vetorial. Visto no localhost (painel da Arma, loja, aba Missões). Não visto: a arma na Mala (código igual ao da loja) e o chapéu no tema bege com zoom.
- **Avisos novos (2026-11-12):** nenhum alert/confirm do navegador no jogo; todos viraram janelas no centro, no padrão da pasta, com textos mais claros (energia, cash, ouro, Mala, servidor, família, duelo). Visto no localhost nos dois temas (energia cheia, sair da conta, falta de cash na loja, Esc cancelando). Não visto: cada um dos outros avisos na tela (cobertos por teste de código) e o aviso de recusa do servidor.
- **Defeito corrigido (2026-11-12):** o servidor recusava o progresso de quem tinha 2 itens iguais na Mala (ex.: 2 uísques): "item repetido". Reportado pelo Kya. Corrigido e coberto por teste.
- **Abas novas e renomeadas (2026-11-12):** abas Ficha, Missões, Duelo, Mercado Negro, Ranking, Família, Distritos, Tarefas, Eventos e Simulador; curvas das abas removidas; balão do nome da aba por cima de tudo; o chefão agora é a "missão especial do servidor" no alto de Missões (sempre aparece por enquanto). Distritos, Tarefas e Eventos são pastas vazias (a desenhar). Visto no localhost; varredura de contraste sem problemas nos dois temas e nas 10 abas.
- **Pasta, segunda rodada (2026-11-11):** fontes Rye e Bebas Neue, HUD só com ícones, atributos menores, subpasta do Perfil (Mala, Família, Conquistas, Honra) e abas ativas ligadas à pasta. Família e Honra usam dados reais; Conquistas é só a grade de "?" (o sistema não existe). Visto no localhost em 1672 e 1280, nos dois temas; varredura de contraste sem problemas. Não visto: o Chacal na tela nova e celular.
- **Pasta de arquivo, dois temas (2026-11-11):** todas as 8 abas viraram pastas (abas de ícone à esquerda, orelha, carimbo, costura); Perfil como ficha; botão de tema no HUD (couro e dourado / bege, guardado no navegador). Varredura de contraste: 0 problemas nas 8 abas nos dois temas. Visto no localhost em 1672 e 1280. Não visto: o Chacal na tela nova, arrastar com o mouse de verdade, celular e a tela de combate no tema bege.
- **Painel de atributos limpo (2026-11-11):** saíram o texto de dica e a caixa de Armadura/Esquiva/Bônus de crítico/Passivas. Esses valores continuam valendo no combate, só não aparecem mais no perfil.
- **Perfil sem rolagem (2026-11-11):** a página não rola mais; o perfil cabe na tela (conferido em 1672x941 e 1280x720); Mala sem cabeçalho com o nome de lado; botão de personalizar no canto do boneco; "Equipamento" só mostra atributos no balão. Abas Loja e Simulador ainda passam da tela e rolam por dentro. Pendente: o que o fundador chamou de "imagem 3" (só chegaram 2 imagens).
- **Novo layout do perfil (2026-11-11):** arma em painel próprio, 8 itens em grade 4 x 2 e Mala embaixo, como no desenho do fundador. Visto no localhost em 1672 e 1280 (sem rolagem lateral). Não visto: arrastar com o mouse de verdade e tela de celular.
- **Itens dos 8 slots funcionando (2026-11-11):** perfil com os 8 slots, loja "Itens do Perfil" (1 item por slot, atributos à vista, estoque muda a cada compra), drop de missão aleatório, balão em cada item, conferência no servidor e conversão de saves antigos. Visto no localhost com conta de teste (comprar, equipar, balão, conferido no banco). Não visto: um drop real de missão, o Chacal convertido (só testado por teste automático) e o desenho em tela de celular.
- **Sorteio dos 8 slots, etapa 1 (2026-11-11):** existe a regra pura que sorteia um item de um dos 8 slots (Chapéu, Peitoral, Calça, Calçado, Amuleto, Pet, Relíquia, Veículo) no nível do jogador, com 0,5 ponto por nível (mínimo 1) sorteado entre os 4 atributos. Só código e testes (9 novos, 228 no total): **o jogo ainda não usa**; falta servidor (D2) e tela.
- **Itens em pontos pequenos e drop sem nível (2026-11-11):** o HP inflado era a armadura somando 350 pontos de Vida; agora os itens dão poucos pontos (valores provisórios). O drop de missão não exige mais o nível do item, e "Mala cheia" só aparece quando está cheia de verdade. Testes automáticos novos; loja conferida no localhost. Não visto: um drop real numa missão e o HP de um personagem de nível alto com armadura.
- **Barras só à esquerda da seta e balão em todo item (2026-11-11):** a troca para dano/HP/crítico/redução só vale à esquerda da seta; todo item da Mala mostra balão (tipo, nome, atributos, preço) ao passar o mouse. Visto no localhost.
- **Barras juntas, menores, e Mala limpa (2026-11-11):** passar o mouse em qualquer barra troca as 4 (Dano base, HP máximo, Crítico, Redução); barras menores; Mala sem o texto de ajuda e sem a caixa vazia (os detalhes só aparecem ao clicar num item). Visto no localhost.
- **Atributos em estilo de tabela (2026-11-11):** a pedido do fundador (imagem de referência), cada atributo é uma linha de tabela com valor à direita, seta e um "+" em pílula brilhante (dourada; verde quando há pontos livres). Visto no localhost; o verde foi visto simulando a classe, não subindo de nível.
- **Slots livres na Mala e "+" único (2026-11-11, decisão do fundador):** dá para arrastar qualquer item da Mala para um slot vazio ou trocar com outro; a posição é salva no servidor (conferido no banco). Cada atributo tem só um "+" (preço no balão; gasta ponto livre quando há). Visto no localhost com conta de teste (apagada). Não visto: o "+" verde com pontos livres na tela e arrastar com o mouse de verdade (usei eventos simulados).
- **Tela proporcional e Mala (2026-11-11, decisão do fundador):** todo o CSS e o código do jogo estão em rem (1 rem = 1/104,5 do palco 16:9), sem px fixo e sem regras por largura. Medido em 1672, 1280, 2560x1080 e 390 de largura: sem rolagem lateral, 8 abas em 1 linha, mesmo desenho. A mochila virou "Mala" (10 slots, 2 fileiras de 5, slot 50% maior: 110 px no palco de 1672). **Nos celulares em pé o jogo fica bem pequeno** (é o preço da escala proporcional).
- **Respeito só de duelo (2026-11-11, decisão do fundador):** missões, NPC, doação e Chefão não dão mais Respeito; o servidor recusa Respeito de outra origem. Conta de teste "Chacal" zerada (tinha 165).
- **Ouro (2026-11-11, decisão do fundador):** +125 de ouro a cada nível subido (missão, duelo ou treino); drop raro em missão vencida (3%, de 10 a 30, 10 mais provável); compra com dinheiro real fica para depois. Com isso, em 1 nível já dá para pagar 125 de ouro e duelar antes da espera. O sorteio do drop roda no navegador (a trava no servidor é a tarefa D2); o servidor confere o teto (25 + 125 por nível + 30 por missão).
- **Respeito inicial 0 e duelo com espera de 10 min (2026-11-11, decisão do fundador):** todo jogador novo começa com 0 de Respeito. Sem limite por hora. 1 duelo grátis a cada 10 min; antes disso, 125 de ouro. A espera de 10 min vale para a conta toda (confirmado). Contas criadas antes desta mudança (as de teste do fundador) continuam com o Respeito antigo.
- **Duelo sem faixa de nível (2026-11-11, decisão do fundador):** qualquer jogador pode duelar com qualquer outro; espera de 10 min contra o mesmo rival confirmada. Prêmio por Ranking (Respeito) fica para depois; os valores atuais são provisórios.
- **Não é à prova de trapaça ainda:** missões, loja e treino são decididos no navegador (tarefa D2). O servidor segura exageros de nível, missões, cash, ouro e Respeito, mas quem conhece o código ainda consegue andar mais rápido que o normal dentro desses limites.

## Comparação, atributos e mochila (2026-11-11)
- **Defeito reproduzido e corrigido:** depois de trocar a arma arrastando, o balão de comparação não aparecia mais (o item arrastado some da tela na troca e o aviso de fim do arrastar nunca chegava). Prova: com o código antigo o balão ficou escondido com o mouse sobre uma arma da mochila; com o novo aparece comparando com a nova equipada. Também vale com a mochila cheia.
- **Painel de atributos compacto** ao lado do personagem, sem emojis (pontos + botões). Balão: Ataque mostra "Dano base: 1.822, cada ponto a mais: +152" e lembra que o dano da arma é somado; Astúcia mostra "chance de crítico 1,2%, +0,12% por ponto". Layout medido em 1.280, 1.101, 1.024 e 390 px, sem rolagem lateral.
- **Mochila de 10 espaços, 5 por linha:** "4 / 10 slots"; cheia mostra "10 / 10 slots (cheia)"; comprar com a mochila cheia, guardar a arma e o drop de missão têm aviso claro. A troca de arma arrastando funciona com a mochila cheia (mantém 10/10).
- **Defeito de loja corrigido:** antes, faltando cash, o ouro já era cobrado e perdido. Agora tudo é conferido antes de cobrar.
- **Site no ar (Vercel), verificado (nível 2):** painel compacto sem emojis, mochila "1 / 10 slots" em 5 colunas; troquei a arma arrastando e o balão de comparação apareceu (Colt contra o Revólver equipado). Conta apagada.
- 18 testes novos (8 de atributos, 10 de mochila e compra): total 148.
- **Não testado:** o defeito do balão só aparece num navegador, então não tem teste automático (a regra de contas tem); celular real (sem arrastar com o dedo); leitor de tela.

## Layout (2026-11-11)
- **Atualização final (R-LAYOUT-5):** palco do tamanho da imagem do login (1672 x 941). Medido no navegador: em 1366 px tudo ocupa a tela toda; em 1920 e 2560 px o palco fica centralizado (preto de 124 px e 444 px de cada lado, e 70 px e 250 px em cima e embaixo no login), sem borda, arredondamento nem sombra. 2 testes novos conferem isso, inclusive o tamanho da imagem.
- **Histórico:** a margem preta descrita abaixo foi **removida a pedido do fundador** (R-LAYOUT-5). O jogo e o login voltaram à tela cheia, sem moldura; o jogo mantém a largura máxima original de 1440 px, centralizada. As medições de 6% abaixo valiam só enquanto a margem existiu.
- Margem preta de **6% de cada lado** e 2% em cima e embaixo no desktop (a partir de 1024 px); medida no navegador em 1024, 1280, 1366, 1440, 1920 e 2560 px: sempre 6,00%, sem rolagem lateral, sem aba cortada (2 linhas até 1440 px, 1 linha em 1920 px ou mais). Em 768 px nada mudou. 4 testes automáticos em `layout.test.ts`.
- **Tela de login com a mesma margem (2026-11-11):** moldura medida em 1024, 1366, 1920 e 2560 px: 6,00% de cada lado e 2% em cima, com o cartão de login dentro da moldura e sem rolagem lateral. Em 390 px (celular) a imagem continua de ponta a ponta, sem rolagem. Observação do teste: uma primeira medição deu zero porque havia uma sessão antiga no navegador (a tela de login estava fechada); refeita com o armazenamento limpo.
- Antes, a barra de 8 abas já ficava cortada atrás de rolagem em telas médias (ela precisa de 1472 px); agora quebra em 2 linhas.
- **Não verificado:** celular real, monitores com zoom do sistema acima de 100%, Safari e Firefox (testei só no navegador do app).

## Jogado no localhost (2026-11-11)
- Criação de personagem funciona.
- As 8 abas abrem sem erro de console.
- Missão: custou 15 de energia, deu +45 XP, +$160, +15 de respeito e um item. Funciona.
- Duelo: custou 10 de energia, luta de nível 1 contra nível 1 foi **perdida**. Funciona, mas o início pode estar duro (ver C6).
- Na luta da missão, o inimigo de nível 1 tinha 935 de vida contra 400 do jogador.

## Maturidade por parte

| Parte | Nível | Observação |
|---|---|---|
| Motor de combate | 1 | Testado e determinístico; ainda não rodou no servidor |
| Simulador de balanceamento | 1 | CLI funciona; não rodei o relatório completo nesta sessão |
| Front-end / loop de jogo | 1 | Jogável local; lacunas em C1 |
| Servidor, contas, banco, pagamento | 0 | Não existe |
| Ranking, Família, Eventos | 0 | Simulados |

## Lacunas do MVP (C1), por prioridade
1. ~~Energia não regenera com o tempo (C2)~~ feito.
2. ~~Erro de tipo em `strike.ts:53` (C3)~~ feito.
3. ~~Nome e marca no jogo (C4)~~ feito.
4. ~~Ranking, Família e Eventos falsos (C5)~~ agora assumem ser NPCs, com aviso na tela. Conteúdo real só com servidor (D3). Pendência conhecida: o cofre da Família (doações) é alterado só na memória da página e some ao recarregar.
5. Equilíbrio do início do jogo (C6).
6. Tutorial e teste longo de jogo (C7).
7. README desatualizado (C8).
8. Dependências com alerta de segurança (C9).

## Não verificado
- Painel da Vercel, domínio e variáveis de ambiente.
- Jogo no ar de ponta a ponta (só abri a tela inicial).
- Duelos, loja, compra, venda, equipar, treino de atributos e eventos em profundidade.
- Celular, desempenho e acessibilidade.
- Alterações não commitadas pré-existentes: `.gitignore`, `vercel.json` (do fundador).
