// Gera docs/PLANO_MESTRE.md e docs/FILA_DE_EXECUCAO.md a partir de tarefas.mjs.
// Uso: npm run plano
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { etapas, tarefas, fila } from './tarefas.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const docs = join(aqui, '..');

const EMOJI = { A_FAZER: '⏳ A FAZER', EM_ANDAMENTO: '🔄 EM ANDAMENTO', FEITO: '✅ FEITO', BLOQUEADA: '❌ BLOQUEADA' };
const porId = new Map(tarefas.map((t) => [t.id, t]));
const etapaPorId = new Map(etapas.map((e) => [e.id, e]));

// valida a fonte (falha alto em vez de gerar plano errado)
const ids = new Set();
for (const t of tarefas) {
  if (ids.has(t.id)) throw new Error(`ID duplicado: ${t.id}`);
  ids.add(t.id);
  if (!etapaPorId.has(t.etapa)) throw new Error(`Etapa inexistente em ${t.id}: ${t.etapa}`);
  if (!EMOJI[t.estado]) throw new Error(`Estado inválido em ${t.id}: ${t.estado}`);
  for (const d of t.depende) if (!porId.has(d)) throw new Error(`${t.id} depende de ID inexistente: ${d}`);
}
for (const [id] of fila) if (!porId.has(id)) throw new Error(`Fila cita ID inexistente: ${id}`);

const etapaConcluida = (eid) => tarefas.filter((t) => t.etapa === eid).every((t) => t.estado === 'FEITO');

function bloqueada(t) {
  if (t.estado === 'FEITO') return false;
  if (t.estado === 'BLOQUEADA') return true;
  const e = etapaPorId.get(t.etapa);
  if (e.dependeDe.some((x) => !etapaConcluida(x))) return true;
  return t.depende.some((d) => porId.get(d).estado !== 'FEITO');
}

const feitas = tarefas.filter((t) => t.estado === 'FEITO');
const feitasN2 = feitas.filter((t) => typeof t.nivel === 'number' && t.nivel >= 2);
const andamento = tarefas.filter((t) => t.estado === 'EM_ANDAMENTO');
const pendentes = tarefas.filter((t) => t.estado !== 'FEITO' && t.estado !== 'EM_ANDAMENTO');
const bloqueadas = pendentes.filter(bloqueada);
const liberadas = pendentes.filter((t) => !bloqueada(t));

const linha = (t) =>
  `| ${t.id} | ${t.titulo}${typeof t.nivel === 'number' ? ` (nível ${t.nivel})` : ''} | ${t.dono} | ${EMOJI[t.estado]} | ${t.quando} |`;

let md = '';
md += '<!-- GERADO por docs/plano/gerar.mjs a partir de docs/plano/tarefas.mjs. NÃO EDITE À MÃO. -->\n\n';
md += '# Plano mestre: Mobster Rise\n\n';
md += '## Onde estamos\n\n';
md += `- Tarefas: **${tarefas.length}** em **${etapas.length}** etapas\n`;
md += `- Feitas: **${feitas.length}** (com nível 2 ou mais registrado: **${feitasN2.length}**)\n`;
md += `- Em andamento: **${andamento.length}**\n`;
md += `- Liberadas para começar: **${liberadas.length}**\n`;
md += `- Bloqueadas por outra tarefa ou etapa: **${bloqueadas.length}**\n\n`;
md += '| Etapa | Feitas / Total | Situação |\n|---|---|---|\n';
for (const e of etapas) {
  const ts = tarefas.filter((t) => t.etapa === e.id);
  const f = ts.filter((t) => t.estado === 'FEITO').length;
  const sit = f === ts.length ? 'Concluída' : e.dependeDe.some((x) => !etapaConcluida(x)) ? 'Aguarda ' + e.dependeDe.filter((x) => !etapaConcluida(x)).join(', ') : 'Liberada';
  md += `| ${e.id}. ${e.nome} | ${f} / ${ts.length} | ${sit} |\n`;
}
md += '\n## Tarefas por etapa\n';
for (const e of etapas) {
  md += `\n### Etapa ${e.id}: ${e.nome}\n\n| ID | Tarefa | Dono | Estado | Quando |\n|---|---|---|---|---|\n`;
  for (const t of tarefas.filter((x) => x.etapa === e.id)) md += linha(t) + '\n';
}
writeFileSync(join(docs, 'PLANO_MESTRE.md'), md);

let q = '<!-- GERADO por docs/plano/gerar.mjs. NÃO EDITE À MÃO. A ordem vem de `fila` em tarefas.mjs. -->\n\n';
q += '# Fila de execução\n\n| # | ID | Tarefa | Dono | Situação | Por que nesta posição |\n|---|---|---|---|---|---|\n';
let n = 0;
for (const [id, porque] of fila) {
  const t = porId.get(id);
  if (t.estado === 'FEITO') continue;
  n += 1;
  q += `| ${n} | ${t.id} | ${t.titulo} | ${t.dono} | ${bloqueada(t) ? '🔒 bloqueada' : '🟢 liberada'} | ${porque} |\n`;
}
writeFileSync(join(docs, 'FILA_DE_EXECUCAO.md'), q);

console.log(`Plano gerado: ${tarefas.length} tarefas, ${feitas.length} feitas, ${liberadas.length} liberadas, ${bloqueadas.length} bloqueadas.`);
