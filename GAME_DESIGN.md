# GAME_DESIGN.md — Jogo de gangsters (nome provisório)

> Status: brainstorm consolidado. **Todos os números são valores iniciais para o simulador**, não definitivos.
> Este arquivo é a fonte de verdade do design. Se o código divergir daqui, o código está errado (ou este arquivo precisa ser atualizado por decisão explícita do dono do projeto).

---

## 1. Visão

Jogo free-to-play de navegador (web mobile-first / PWA), persistente, com missões por energia, combate automático, PvP, ranking e clãs ("famílias"). Tema: submundo/máfia em universo **fictício**, em PT-BR.

- Entrada gratuita e jogável sem gastar nada.
- Quem paga evolui **mais rápido** (tempo e conveniência), não ganha vitória garantida.
- Combate resolvido no servidor, com decisões do jogador **antes** da luta (fases futuras).

## 2. Regras de ouro

1. **Servidor autoritativo.** O cliente nunca calcula resultado. Só exibe o replay.
2. **Determinismo.** Mesma entrada + mesma seed = mesma luta, sempre.
3. **Nenhum número de balanceamento no código.** Tudo vem de `config/balance.config.json`.
4. **Propriedade intelectual.** Não usar código, nomes, arte ou textos do Goodgame Gangster ou de qualquer jogo de terceiros. Mecânicas genéricas são livres; nomes e identidade são próprios.
5. **Ouro (moeda premium) nunca compra pontos de atributo.** Ver seção 8.
6. **Sem conversão de moedas do jogo em dinheiro real.**
7. **Sem sorteio pago** (itens aleatórios por dinheiro real). Qualquer compra premium é determinística.

## 3. Atributos e pontos

O personagem tem 4 colunas de pontos:

| Coluna | Efeito |
|---|---|
| **Ataque** | Dano base do golpe |
| **Vida** | Total de HP |
| **Astúcia** | Chance de acerto crítico |
| **Tenacidade** | Reduz o **bônus** do crítico recebido |

### 3.1 Pontos iniciais (nível 1)

- Total de **40 pontos**, distribuídos entre as 4 colunas, cada coluna entre **8 e 12**, soma sempre 40.
- A distribuição é sorteada de forma **determinística a partir do ID da conta** (não dá para rerolar abrindo o jogo de novo).
- Todos os estilos usam o mesmo sorteio. O estilo só muda as escalas e passivas.

### 3.2 Pontos por nível

- **4 pontos livres por nível**, distribuídos onde o jogador quiser.
- Pontos totais no nível L: `40 + 4 × (L − 1)` (436 no nível 100).
- Pontos adicionais podem ser **treinados com cash** (moeda comum do jogo). **Não há limite de pontos treinados por nível.** O freio é o custo crescente (ver seção 8).

### 3.3 Ataque e Vida: escala linear com o nível

```
valorPorPonto(coluna, L) = base[coluna] × (1 + levelGrowth × (L − 1))
Ataque efetivo = pontosAtaque × valorPorPonto(ataque, L) × escalaAtaqueDoEstilo
Vida   efetiva = pontosVida   × valorPorPonto(vida,   L) × escalaVidaDoEstilo
```

Valores iniciais: `base.ataque = 10`, `base.vida = 100`, `levelGrowth = 0.1`.
Ou seja, os mesmos pontos valem mais a cada nível.

### 3.4 Astúcia e Tenacidade: percentual por pontos, com teto

```
P50(L) = 15 + 7 × (L − 1)          // pontos necessários para o teto de 50% no nível L
percentual = 50% × pontosEfetivos / P50(L)      // travado em 50%
```

- Vale para **chance de crítico** (Astúcia) e **redução do bônus de crítico** (Tenacidade).
- Teto de **50%** nas duas.
- Itens e bônus **nunca** dão "+X% de crítico": dão **pontos**, e o percentual sai da fórmula.
- Se o jogador não investe, o percentual **cai** conforme o nível sobe. Isso é intencional (cria demanda por pontos/itens/consumíveis).
- `pontosEfetivos` = pontos × multiplicador de passiva do estilo (seção 5), quando houver.

Referência (pontos para o teto): nível 1 = 15, nível 10 = 78, nível 50 = 358, nível 100 = 708.

## 4. Estilos de personagem

| | **Carrasco** (dano) | **Muralha** (vida) | **Malandro** (equilibrado) |
|---|---|---|---|
| Foco | Muito dano | Muita vida, sofre pouco por golpe | Entre os dois, esquiva e skills únicas |
| Escala Ataque | ×2,2 | ×0,55 | ×1,1 |
| Escala Vida | ×0,5 | ×1,95 | ×0,85 |
| Redução de dano (armadura **fixa**) | 15% | 25% | 20% |
| Esquiva (**fixa**) | 5% | 5% | 15% |
| Bônus de dano do crítico | +80% a +120% (média +100%) | +50% a +90% (média +70%) | +50% a +90% (média +70%) |

Regras:
- Armadura (redução de dano) e esquiva dependem **apenas do estilo** e não mudam por item, nível ou atributo.
- O bônus do crítico é sorteado uniformemente dentro da faixa a cada crítico.
- As escalas de estilo também multiplicam o bônus de dano da arma.

## 5. Passivas (sempre ativas, sem escolha do jogador)

### Carrasco
1. **Golpe de abertura:** o primeiro ataque do personagem na luta ganha `+10% a +100%` de dano.
   `bônus = 10% + 90% × (astúciaPrópria / (astúciaPrópria + astúciaOponente))` (usando pontos efetivos).
2. **Brutalidade:** crítico mais forte (faixa da tabela da seção 4).
3. **Execução:** ignora **25% da armadura** do alvo (`reduçãoEfetiva = reduçãoAlvo × 0,75`).

### Muralha
1. **Couraça:** armadura fixa superior (25%, já na tabela).
2. **Intimidação:** reduz o dano recebido nas **primeiras 3 rodadas**.
   `redução = 10% + (% de Vida a mais que o oponente ÷ 10) × 1%`, mínimo 10%, **teto 25%**.
3. **Casca grossa:** cada ponto de Tenacidade conta como **1,4 ponto**.

### Malandro
1. **Reflexos:** esquiva de 15% (5% base + 10 pontos).
2. **Adaptação:** `+0,2%` de Ataque para cada `1%` de vida perdida (teto natural de +20%).
3. **Instinto:** cada ponto de Astúcia conta como **1,2 ponto**.

> Sangria, Fúria, Regeneração, Retaliação e Última resistência foram **descartadas**. Não implementar.

## 6. Combate

### 6.1 Estrutura da luta

- Dois lutadores se alternam em golpes. **Uma rodada** = cada lutador agiu uma vez.
- **Não há máximo de rodadas nem empate.** A luta termina quando alguém chega a 0 de vida.
- Quem ataca primeiro: o de maior Astúcia efetiva em pontos. Empate: sorteio pela seed.
- Salvaguardas técnicas (invisíveis ao jogador): dano mínimo de **1** por golpe que acerta, e um limite interno de rodadas (ex.: 10.000) que, se atingido, lança erro (é bug, não regra de jogo).

### 6.2 Ordem de cálculo de um golpe

1. **Esquiva:** sorteio com a esquiva do defensor. Se esquivou, o golpe termina (sem dano).
2. **Dano base:** `(pontosAtaque × valorPorPonto(ataque, L) + U(armaMin, armaMax)) × escalaAtaqueDoEstilo`
3. **Crítico:** sorteio com a chance do atacante. Se crítico: `dano × (1 + bônusCrítico × (1 − tenacidadeDoDefensor))`.
   A Tenacidade reduz **só o bônus**, nunca transforma o crítico em dano menor que o golpe normal.
4. **Golpe de abertura** (se aplicável), multiplicando.
5. **Adaptação** (se aplicável), multiplicando.
6. **Armadura:** `dano × (1 − reduçãoEfetiva)` (com Execução quando o atacante for Carrasco).
7. **Intimidação** (se aplicável, defensor Muralha, rodadas 1 a 3): `dano × (1 − redução)`.
8. Arredondar e aplicar mínimo de 1.

Regra de composição: modificadores de **tipos diferentes se multiplicam**; modificadores do **mesmo tipo somam**. Não existe empilhamento livre.

## 7. Configuração inicial (`config/balance.config.json`)

```json
{
  "levelCap": 100,
  "points": { "start": 40, "perLevel": 4, "startDraw": { "min": 8, "max": 12 } },
  "valuePerPoint": { "attack": 10, "life": 100, "levelGrowth": 0.1 },
  "percentCurves": { "cap": 0.5, "p50Base": 15, "p50PerLevel": 7 },
  "combat": { "minDamage": 1, "safetyMaxRounds": 10000 },
  "styles": {
    "carrasco": {
      "attackScale": 2.2, "lifeScale": 0.5, "armorReduction": 0.15, "dodge": 0.05,
      "critBonus": [0.8, 1.2],
      "passives": {
        "openingStrike": { "min": 0.10, "max": 1.00 },
        "executionArmorIgnore": 0.25
      }
    },
    "muralha": {
      "attackScale": 0.55, "lifeScale": 1.95, "armorReduction": 0.25, "dodge": 0.05,
      "critBonus": [0.5, 0.9],
      "passives": {
        "intimidation": { "base": 0.10, "cap": 0.25, "rounds": 3, "perTenPctExtraLife": 0.01 },
        "tenacityPointMultiplier": 1.4
      }
    },
    "malandro": {
      "attackScale": 1.1, "lifeScale": 0.85, "armorReduction": 0.20, "dodge": 0.15,
      "critBonus": [0.5, 0.9],
      "passives": {
        "adaptationPerPctLifeLost": 0.002,
        "astuciaPointMultiplier": 1.2
      }
    }
  }
}
```

## 8. Progressão e economia (fora do escopo da fase 1, registrado para contexto)

- **Cash (moeda comum):** ganho jogando. Treina pontos de atributo com **custo crescente** (sobe com os pontos já treinados no atributo e com o nível). **Astúcia e Tenacidade custam cerca de 1/5 do preço** de Ataque e Vida, porque rendem menos por ponto. Sem limite de pontos por nível.
- **Ouro (moeda premium, comprada com dinheiro real):** **não compra pontos** e **não converte em cash**. Serve para: repor energia, acelerar timers, slots (inventário/equipamento), consumíveis premium, cosméticos e redistribuir pontos (respec).
- **Reposição de energia com ouro: no máximo 5 vezes por dia.** (Custo crescente a cada uso no dia: proposta inicial, a calibrar.)
- **Consumíveis:** 3 slots ativos com bônus percentual temporário. Proposta: teto de **+20% total** de bônus de consumíveis, duração curta, versões obtíveis jogando.
- **Armas:** dano mínimo/máximo que cresce com o nível. Raridade com multiplicador modesto (proposta: ×1,0 a ×1,4). Detalhes na fase de itens.
- **Nível máximo do MVP:** 100. Curva de XP: a definir na fase de economia.
- **Missões:** custam energia, duram um tempo e terminam em combate automático. Conteúdo textual por IA gerado **em lote com cache**, sobre tabelas fixas de recompensa. Chamadas individuais de LLM só com limite diário.
- **NPCs/famílias NPC:** simulados por regras, com camada de personalidade por LLM, sempre **declarados como NPCs**.

## 9. Metas de balanceamento

- Entre os 3 estilos, no mesmo nível e com builds razoáveis: **taxa de vitória de 45% a 55%**, sem estilo dominante.
- Diferença entre os melhores e piores perfis sorteados no nível 1, dentro do mesmo estilo: **menos de 5 pontos percentuais**.
- Duração da luta: **reportar, não impor**. Alvo desejável de 8 a 15 rodadas, mas lutas curtas em Carrasco × Carrasco são esperadas. A decisão sobre aceitar isso é do dono do projeto, com base nos números.
- Nenhum atributo ou build pode ser estritamente dominante (ex.: "nunca vale investir em Astúcia").

## 10. Pontos em aberto (decisão do dono do projeto)

1. O golpe de abertura é consumido mesmo se o golpe for esquivado? (padrão provisório: **sim**).
2. Pontos efetivos ou brutos de Astúcia no fator do golpe de abertura? (padrão provisório: **efetivos**).
3. Valor exato do custo de treino, XP, energia e drops (fase de economia).
4. Nomes finais dos estilos, do atributo de crítico e do jogo.
5. Sistema de armas com vantagem de classe (pedra-papel-tesoura): **fase 2**, depois que o combate base estiver balanceado.
6. Reduzir ou não o espalhamento das escalas se Carrasco × Carrasco for curto demais.

## 11. Roadmap

1. **Fase 1:** motor de combate puro + simulador + testes. (ver `PROMPT_01_MOTOR_COMBATE.md`)
2. **Fase 2:** balanceamento com os resultados do simulador.
3. **Fase 3:** esqueleto do backend (contas, personagem, energia, missões, duelos) usando o motor.
4. **Fase 4:** economia (cash, ouro, loja, consumíveis, armas), simulador econômico.
5. **Fase 5:** clãs, NPCs, conteúdo por IA, eventos e temporadas.
