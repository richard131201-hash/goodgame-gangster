# Gangster Combat Engine & Balancing Simulator (Fase 1)

Motor de combate automático determinístico e simulador estatístico de balanceamento para jogo de navegador/PWA (universo mafioso fictício), desenvolvido em **TypeScript estrito (Node 20+)** seguindo as especificações do `GAME_DESIGN.md`.

---

## 1. Visão Geral da Arquitetura

O projeto é dividido em dois módulos estritamente desacoplados:

- **`src/engine/` (Biblioteca Pura de Combate)**:
  - 100% livre de efeitos colaterais, sem dependências de I/O, rede, disco (`fs`) ou relógio (`Date.now`), garantindo execução idêntica no Node.js e em qualquer navegador moderno.
  - PRNG determinístico Mulberry32 com aritmética inteira de 32 bits (`Math.imul`, `>>> 0`). Proibido `Math.random()`.
  - Zero números mágicos: todos os parâmetros de combate e estilos são validados e lidos a partir de `config/balance.config.json` via schema Zod estrito.
- **`src/sim/` (Simulador CLI e Análise Estatística)**:
  - Executa simulações em massa (100.000+ lutas por célula).
  - Alternância de posições A/B em 50% das lutas para eliminar viés de ordem.
  - Análise de quantis (médias, medianas, percentis p5..p95), vantagem do primeiro ataque, taxas de acerto crítico e esquiva, e dispersão no nível 1.
  - Alertas automáticos de desbalanceamento e exportação em tabelas, CSV e JSON.

---

## 2. Onde Cada Regra do Design Está Implementada

| Regra / Mecânica | Arquivo | Linhas / Função | Descrição |
|---|---|---|---|
| **Configuração e Schema Zod** | `src/engine/schema.ts` | `validateConfig`, `BalanceConfigSchema` | Validação estrita de limites, faixas e integridade do JSON de balanceamento. |
| **PRNG Mulberry32 & hashSeed** | `src/engine/prng.ts` | `PRNG`, `hashSeed`, `createPRNG` | Gerador determinístico de 32 bits e hashing com MurmurHash3 finalizer para descorrelacionar seeds sequenciais. |
| **Sorteio de Pontos Iniciais** | `src/engine/points.ts` | `rollStartingPoints` | Enumeração analítica das 85 combinações (8..12, soma 40) e sorteio uniforme sem viés por ID de conta. |
| **Atributos Derivados & P50** | `src/engine/stats.ts` | `derivedStats`, `getP50`, `getValuePerPoint` | Escala linear de Ataque/Vida, teto de 50% em Astúcia/Tenacidade e passivas de pontos (Instinto, Casca grossa). |
| **Passiva: Instinto (Malandro)** | `src/engine/stats.ts` | `getEffectiveAstuciaPoints` | Multiplica pontos de Astúcia por 1,2 para cálculo de crítico e iniciativa. |
| **Passiva: Casca Grossa (Muralha)** | `src/engine/stats.ts` | `getEffectiveTenacidadePoints` | Multiplica pontos de Tenacidade por 1,4 para cálculo de redução de crítico. |
| **Ciclo de 8 Passos do Golpe** | `src/engine/strike.ts` | `executeStrike` | Execução estrita: Esquiva -> Dano Base -> Crítico -> Abertura -> Adaptação -> Armadura -> Intimidação -> Arredondamento e Dano Mínimo. |
| **Esquiva & Armadura Fixas** | `src/engine/strike.ts` | `executeStrike` (passos 1 e 6) | Esquiva e redução de dano determinadas unicamente pelo estilo, imutáveis por atributos ou itens. |
| **Tenacidade (apenas no bônus)** | `src/engine/strike.ts` | `executeStrike` (passo 3) | `dano *= (1 + bonusCritico * (1 - tenacidadeDoDefensor))`. Nunca reduz o dano base. |
| **Passiva: Golpe de Abertura (Carrasco)** | `src/engine/strike.ts` | `executeStrike` (passo 4) | Primeiro ataque da luta; bônus proporcional à razão de Astúcia; consumido mesmo se esquivado. |
| **Passiva: Adaptação (Malandro)** | `src/engine/strike.ts` | `executeStrike` (passo 5) | Fórmula contínua linear: `+0,2%` de dano para cada `1%` de vida perdida no momento do golpe. |
| **Passiva: Execução (Carrasco)** | `src/engine/strike.ts` | `executeStrike` (passo 6) | Ignora 25% da armadura do alvo (`reducaoEfetiva = reducaoAlvo * 0.75`). |
| **Passiva: Intimidação (Muralha)** | `src/engine/strike.ts` | `executeStrike` (passo 7) | Rodadas 1..3; compara Vida Máxima: `10% + (% Vida extra / 10) * 1%` (piso 10%, teto 25%). |
| **Dano Mínimo de 1** | `src/engine/strike.ts` | `executeStrike` (passo 8) | `Math.max(1, Math.round(dano))` em golpes que acertaram. |
| **Iniciativa e Luta Completa** | `src/engine/fight.ts` | `simulateFight` | Maior Astúcia efetiva começa (desempate pela seed); rounds alternados até HP=0; salvaguarda técnica de 10.000 rodadas. |
| **Perfis de Build (Pontos Inteiros)** | `src/sim/builds.ts` | `getBuildPoints` | Builds equilibrada, ofensiva, defensiva, crítica e anti-crítica com soma exata em inteiros. |
| **Simulador CLI & Alertas** | `src/sim/analyzer.ts`, `src/sim/cli.ts` | `runFullSimulation`, `main` | Matrizes 3x3 por nível, métricas, dispersão no L1, alertas automáticos e exportação CSV/JSON. |

---

## 3. Como Rodar os Testes

Para executar toda a suíte de testes com **Vitest**:

```bash
npm test
```

Para rodar em modo watch (desenvolvimento interativo):

```bash
npm run test:watch
```

---

## 4. Como Rodar o Simulador

Para rodar a simulação completa de balanceamento:

```bash
# Simulação padrão recomendada (100.000 lutas por célula, níveis 1, 10, 50, 100, seed 42)
npm run sim -- --fights 100000 --levels 1,10,50,100 --seed 42

# Simulação rápida (10.000 lutas)
npm run sim -- --fights 10000 --levels 1,10,50,100 --seed 42
```

Opções suportadas pela CLI:
- `--fights <número>`: Quantidade de lutas por célula (padrão: 100.000).
- `--levels <n1,n2,...>`: Níveis a simular (padrão: `1,10,50,100`).
- `--seed <número>`: Seed determinística base (padrão: `42`).
- `--outDir <pasta>`: Diretório de saída dos arquivos (padrão: `output`).
- `--csv`: Exporta `output/simulation_matchups.csv` (padrão: `true`).
- `--json`: Exporta `output/simulation_report.json` (padrão: `true`).

---

## 5. Performance Medida

- **Tempo para 3.600.000 lutas (100k lutas por confronto, 4 níveis, single-threaded)**: **11,36 segundos**.
- **Taxa de throughput**: ~**316.000 lutas simuladas por segundo** em um único núcleo de CPU.
