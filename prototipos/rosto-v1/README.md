# Protótipo de rosto v1 (guardado, fora do jogo)

**Estado: pausado em 2026-11-11.** Não é usado pelo jogo e não vai para o site (a compilação só publica o `index.html` da raiz).

## O que é
Experimento de um estilo de personagem mais detalhado (rosto com sombra e volume), com opções separadas de olhos, sobrancelhas, nariz, boca, orelhas, cabelo, barba, óculos, cicatriz, chapéu, charuto, tapa-olho, brinco e corrente, e paletas de cor. É desenhado em código (SVG), por `faces.js`.

## Por que foi pausado
O fundador comparou com arte profissional de outro jogo do gênero e disse, com razão, que o resultado ficou "longe do que realmente quer": falta realismo e acabamento de ilustrador. Arte escrita em código não chega nesse nível. O caminho recomendado é arte em camadas feita por artista ou kit licenciado, e o Claude montar o sistema por cima (tarefa **C15** no plano).

## Como abrir
```bash
npm run dev
```
Depois abra `http://localhost:5173/prototipos/rosto-v1/preview.html` (a porta pode mudar; o terminal mostra qual).

## O que ainda vale aproveitar
- A **lista de opções** (quais olhos, bocas, narizes etc. oferecer) e os nomes em português.
- As **paletas** de pele, cabelo, olhos e terno.
- A ideia de **peças separadas e combináveis**, que é a mesma que um artista usaria nas camadas.

## Regras
- Não ligar este código ao jogo sem decisão do fundador.
- Qualquer arte nova precisa ser **original ou licenciada para uso comercial**. Não copiar arte de outros jogos.
