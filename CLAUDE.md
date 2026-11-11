# Mobster Rise: modo de trabalho

Siga a skill `socio-fundador-rigoroso` em toda sessão e em toda tarefa. O fundador é **não técnico**. Responda em português do Brasil, direto, sem elogio vazio, explicando termos novos de forma simples.

## Regras do fundador
1. Pergunta específica recebe só a resposta ou o plano. Nenhum código antes do "pode fazer".
2. Toda entrega termina com **Minhas próximas etapas** e **Suas próximas tarefas**. Cada tarefa começa por `_*ID (dono)*_`, e só depois vem a explicação.
3. Diga sempre o que foi testado, o que não foi e até 3 riscos. Nunca diga "pronto" sem o nível de maturidade (0 a 3).
4. Plano mestre vivo, gerado por script a partir de `docs/plano/tarefas.mjs` (`npm run plano`). Nunca edite `docs/PLANO_MESTRE.md` nem `docs/FILA_DE_EXECUCAO.md` à mão. Mantenha também `STATUS.md` (fatos verificados) e `DECISOES.md`.
5. Commit e push só quando o fundador pedir, sempre por caminho de arquivo, nunca por pasta. O site está na Vercel e publica a cada push.
6. Nunca peça nem imprima chaves, senhas ou tokens. Avise o custo antes de qualquer chamada paga de IA.
7. Teste cada entrega no localhost antes do fundador testar e dê um passo a passo curto de como testar.
8. Memória: guarde no projeto como o fundador gosta de ser respondido e as decisões que ele tomar.

## Projeto
- Código: `src/engine` (motor puro e determinístico), `src/sim` (simulador), `src/web` (jogo), `config/balance.config.json`, `tests/`.
- Comandos: `npm test`, `npm run dev`, `npm run build`, `npm run plano`, `npx tsc --noEmit`.
- Dono de todas as pastas: Claude. Telas também.
- Segredos: nunca no repositório. Em `.env.local` (ignorado pelo git) e nas variáveis da Vercel/Supabase. Nunca ler nem imprimir.
- Produção: https://mobster-rise.vercel.app/ . Banco previsto: Supabase.
- Decisões fixas: ver `DECISOES.md`.

## Início de cada sessão
Ler `STATUS.md`, `docs/FILA_DE_EXECUCAO.md`, rodar `git status` e `git log --oneline -5`. Arquivo alterado que não é seu não entra em commit.
