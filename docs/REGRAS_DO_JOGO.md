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

## Produto

| ID | Regra | Valor | Origem | Onde | Teste |
|---|---|---|---|---|---|
| R-PUBLICO-1 | Público | 14 anos ou mais | Fundador, 2026-11-11 | produto | n/a |
| R-DADOS-1 | Onde ficam os dados dos jogadores | Banco de dados (Supabase), com servidor como fonte da verdade | Fundador, 2026-11-11 | a implementar (D2) | n/a |
| R-DADOS-2 | Coletar o mínimo de dados do jogador | Só o necessário para jogar e cobrar | Claude, 2026-11-11 (a confirmar) | a implementar (D2) | n/a |
