# Desenho do banco de dados (D1): Mobster Rise

Estado: **proposta aguardando aprovação do fundador.** Nada disto está implementado (nível 0). Data: 2026-11-11.

## 1. Por que precisamos de servidor
Hoje o progresso fica no navegador (`localStorage`). Qualquer jogador edita ouro, nível, energia e itens. Num jogo em que se paga por vantagem, isso derruba a receita e a confiança. Com servidor, o navegador só **pede** ("fazer missão") e o servidor **decide e grava**.

## 2. Onde fica cada coisa

| O quê | Onde | Por quê |
|---|---|---|
| SQL (tabelas, regras de acesso, funções) | Arquivos em `supabase/migrations/` **no repositório**, aplicados no Supabase por comando (Supabase CLI) | Histórico no git, revisão, backup e volta atrás. Nunca editar o banco clicando no painel (gera diferença entre código e produção) |
| Regras do jogo que valem dinheiro (combate, drop, ganho, compra, energia) | **Servidor**, nunca no navegador | O que roda no navegador o jogador consegue alterar |
| Chave pública (anon) do Supabase | Pode ir no site | Sozinha não dá poder; quem protege é a regra de acesso (RLS) |
| Chave secreta (service role) | Só em variável de ambiente do servidor (Vercel) e `.env.local`. Nunca no git, nunca no navegador, nunca no chat | Dá poder total sobre o banco |
| Dados dos jogadores | Banco Postgres do Supabase | Decisão do fundador (R-DADOS-1) |

Observação: o SQL no repositório não é segredo e não deve ser. A segurança vem das regras de acesso e das chaves, não de esconder o esquema.

## 3. Modelo de dados (rascunho)

| Tabela | Guarda | Quem escreve |
|---|---|---|
| `players` | conta, nome, classe, nível, XP, cash, ouro, energia e `energy_updated_at`, respeito, pontos, aparência, família | só o servidor |
| `item_catalog` | itens da loja e dos drops (arma, blindagem, amuleto, consumível) | só nós (migração) |
| `player_items` | inventário e itens equipados | só o servidor |
| `transactions` | **histórico imutável** de tudo que mexe em cash/ouro/itens (ganho, gasto, compra, venda, drop). Só inserção; ninguém edita nem apaga | só o servidor |
| `fights` | cada luta: quem, seed, resultado, para auditar e reproduzir (o motor é determinístico) | só o servidor |
| `families`, `family_members` | Famílias de jogadores | só o servidor |
| `ranking` (visão) | ordenação por respeito, calculada a partir de `players` | leitura |
| `audit_log` | eventos de segurança (login, falha, compra, valores suspeitos) | só o servidor |

Regra de acesso (RLS): o jogador **lê** só os próprios dados (e o ranking público). **Nenhum jogador grava direto** nas tabelas de jogo; toda escrita passa pelo servidor.

## 4. Como uma ação funciona (exemplo: fazer uma missão)
1. O navegador chama o servidor: "fazer missão X" (com o login do jogador).
2. O servidor lê o jogador no banco e **calcula a energia pelo relógio dele** (não pelo do aparelho).
3. Verifica energia, nível e se a missão existe. Gasta a energia.
4. Roda o combate com o motor (`src/engine`, código puro) e sorteia o drop com o gerador de números aleatórios **do servidor**.
5. Grava jogador, item e uma linha em `transactions` e `fights`, tudo numa única operação (ou tudo, ou nada).
6. Devolve o resultado ao navegador, que só mostra.

## 5. Onde roda a lógica do servidor

| Opção | Prós | Contras |
|---|---|---|
| **A. Funções do Vercel** (pasta `api/`, Node) | Mesmo TypeScript do motor, sem reescrever. Mesmo lugar do site. Segredo fica nas variáveis da Vercel | Mais uma peça para configurar. Custo da Vercel **não verificado** |
| B. Edge Functions do Supabase (Deno) | Tudo no Supabase | Ambiente diferente (Deno); precisa provar que o motor e o `zod` rodam lá |
| C. Funções SQL dentro do banco | Muito seguro e atômico | Reescrever o motor de combate em SQL. Inviável |

**Recomendação: A**, validada numa prova de conceito (D2a) antes de construir o resto. Se falhar, B.

## 6. Segurança (resumo)
- Regras de acesso (RLS) ligadas em todas as tabelas, com teste automático de que um jogador **não** lê nem grava dado de outro.
- Chave secreta só no servidor. Eu nunca a vejo nem a imprimo.
- Limite de chamadas por jogador (contra robô e abuso) e teto por ação.
- Histórico de transações imutável e `audit_log`.
- Conta do fundador no Supabase e na Vercel com verificação em duas etapas e, se possível, um segundo responsável.
- Backup: **não verificado** o que cada plano inclui. Confirmar antes de ter dados reais.

## 7. Custos (fonte: https://supabase.com/pricing, consultada em 2026-11-11; conferir na página antes de decidir)

| Plano | Preço | Banco | Usuários ativos/mês | Observação |
|---|---|---|---|---|
| Free | US$ 0 | 500 MB | 50.000 | **Pausa após 1 semana sem uso** |
| Pro | a partir de US$ 25/mês | 8 GB | 100.000 | Não pausa |
| Team | a partir de US$ 599/mês | 8 GB | 100.000 | Não precisamos |

Cenários (premissas são hipóteses, não medidas):

| Cenário | Premissa | Plano | Custo de banco | Risco |
|---|---|---|---|---|
| Pessimista | Poucos jogadores e a receita não cobre custo | Free no teste fechado, Pro no lançamento | US$ 0 a 25/mês | Free pausa por inatividade: ruim para jogo no ar |
| Realista | Lançamento com jogadores e loja ativa | **Pro** | a partir de US$ 25/mês | Estourar limites se crescer |
| Otimista | Crescimento forte | Pro, monitorando uso | Acima de US$ 25/mês (excedentes: **não verificado**) | Egress e tamanho do banco |

Custo da Vercel para as funções e do provedor de pagamento: **não verificados** (entram em D2 e E3).
**Gatilho de revisão:** passar de 50% do banco (4 GB) ou de 50% dos usuários ativos do plano.
**Reversibilidade:** boa. É Postgres padrão e o SQL está no repositório; trocar de provedor dá trabalho médio, mas não reescreve o jogo.

## 8. Plano de execução

| Passo | O que | Dono |
|---|---|---|
| D0a | Criar conta e projeto no Supabase (2FA), e colocar as chaves em `.env.local` e na Vercel | Fundador |
| D1 | Aprovar este desenho | Fundador |
| D2a | Prova de conceito: uma função do servidor roda o motor de combate e grava no banco, com a chave só no servidor | Claude |
| D2b | Login e save no banco (e-mail + Google) | Claude |
| D2c | Missões, duelos, loja, drops, energia e treino no servidor | Claude |
| D3 | Ranking e Famílias reais | Claude |
| D4 | Antifraude (limites, auditoria, contas duplicadas) | Claude |

## 9. Decisões pendentes (recomendação entre parênteses)
1. Login: e-mail e senha **mais** Google (recomendado).
2. Saves locais de hoje: **descartar**, pois o jogo ainda não foi lançado (recomendado).
3. Aprovar a opção A para a lógica do servidor (recomendado).

## 10. Riscos
1. Prova de conceito (D2a) pode mostrar que o motor precisa de ajuste para rodar no servidor.
2. Plano Free pausa o projeto; não usar em produção com jogadores.
3. Sem teste automático de RLS, um erro de configuração vaza dados de jogadores. Por isso o teste é parte do D2.
