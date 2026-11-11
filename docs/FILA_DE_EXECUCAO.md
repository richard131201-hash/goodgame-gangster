<!-- GERADO por docs/plano/gerar.mjs. NÃO EDITE À MÃO. A ordem vem de `fila` em tarefas.mjs. -->

# Fila de execução

| # | ID | Tarefa | Dono | Situação | Por que nesta posição |
|---|---|---|---|---|---|
| 1 | D0a | Criar conta e projeto no Supabase (2FA), rodar a migração 0001 no SQL Editor e colocar as chaves em .env.local e na Vercel. Nunca no chat (passo a passo no chat) | FUNDADOR | 🟢 liberada | Sua parte, a mais urgente: sem o projeto no Supabase o banco não sai do papel (passo a passo no chat). |
| 2 | D2a | Migração 0001 (tabela de jogadores, RLS, visão pública) em supabase/migrations. Pronto = rodou no projeto real e o teste de RLS prova que um jogador não lê nem grava dado de outro | CLAUDE | 🟢 liberada | SQL já escrito; falta rodar no banco real e provar a segurança. |
| 3 | D2b | Criar conta e entrar (e-mail e senha) dentro do jogo; sem as chaves o jogo segue em modo local | CLAUDE | 🔒 bloqueada | Conta de verdade dentro do jogo. |
| 4 | D2c | Personagem e progresso salvos no banco por função do servidor (Vercel), nunca direto do navegador | CLAUDE | 🔒 bloqueada | Progresso salvo no banco. |
| 5 | D2d | Ver outros jogadores reais (ranking real) na aba Ranking | CLAUDE | 🔒 bloqueada | Ver outros jogadores no Ranking, para testar. |
| 6 | C6 | Balanceamento do início (duelo de nível 1 perdido; inimigo de missão com 935 de vida) usando o simulador | CLAUDE | 🟢 liberada | Primeira impressão: o início precisa ser justo e divertido. |
| 7 | C7 | Tutorial mínimo e teste de 30 a 60 minutos seguidos sem erro nem beco sem saída | CLAUDE | 🔒 bloqueada | Fecha o MVP: prova de 30 a 60 minutos de jogo seguido. |
| 8 | C9 | Dependências com alerta no npm audit (zod alto; tinypool crítico): atualizar em cópia isolada com testes | CLAUDE | 🟢 liberada | Segurança das dependências; pode entrar entre as outras. |
| 9 | C8 | Atualizar o README (descreve só a Fase 1) | CLAUDE | 🔒 bloqueada | Documentação, depois que o MVP estiver estável. |
| 10 | E1 | Busca de marca "Mobster Rise" e registro de domínio | FUNDADOR | 🟢 liberada | Em paralelo: sua parte (marca e domínio). |
| 11 | E2 | Termos de uso e política de privacidade (exigidos ao criar conta); classificação 14+. Revisão profissional a confirmar | FUNDADOR | 🟢 liberada | Em paralelo: sua parte (termos, privacidade, classificação). |
