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
