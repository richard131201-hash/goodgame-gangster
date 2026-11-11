// Teste de ponta a ponta do servidor do jogo contra o banco REAL (migrações 001 e 002).
// Precisa do servidor rodando (npm run dev, porta 5173) ou da URL do site no ar:
//   node --env-file=.env.local supabase/tests/server-e2e.mjs [urlBase]
// Cria 2 usuários de teste, testa criação, nome único, save recusado, ranking e duelo, e APAGA os dois no fim.
// Nunca imprime chaves, tokens nem senhas.

const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const ANON = process.env.VITE_SUPABASE_ANON_KEY || '';
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!URL_ || !ANON || !SRV) {
  console.error('Faltam variáveis no .env.local (SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(2);
}

const rand = () => Math.random().toString(36).slice(2, 8);
const resultados = [];
const check = (nome, ok, detalhe = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${detalhe ? ` (${detalhe})` : ''}`);
};

async function rest(path, { method = 'GET', key = ANON, token, body } = {}) {
  const headers = { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json' };
  const r = await fetch(`${URL_}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await r.json(); } catch { /* corpo vazio */ }
  return { status: r.status, json };
}

async function api(token, payload) {
  const r = await fetch(`${BASE}/api/game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  let json = null;
  try { json = await r.json(); } catch { /* sem corpo */ }
  return { status: r.status, body: json || {} };
}

const criados = [];
async function criarUsuario(rotulo) {
  const email = `teste-e2e-${rotulo}-${rand()}@example.com`;
  const password = `Tt!${rand()}${rand()}${rand()}9`;
  const c = await rest('/auth/v1/admin/users', { method: 'POST', key: SRV, body: { email, password, email_confirm: true } });
  if (c.status >= 300) throw new Error(`Não criou usuário ${rotulo}: status ${c.status}`);
  criados.push(c.json.id);
  const s = await rest('/auth/v1/token?grant_type=password', { method: 'POST', key: ANON, body: { email, password } });
  if (s.status !== 200) throw new Error(`Login do usuário ${rotulo} falhou: status ${s.status}`);
  return { id: c.json.id, token: s.json.access_token };
}

const personagem = (name, style) => ({
  name,
  style,
  weapon: 'colt_1911',
  appearance: {
    gender: 'male', skinTone: '#e2b38f', hairStyle: 'slick', hairColor: '#1b1b1e', eyeColor: '#4e342e',
    facialHair: 'none', facialHairColor: '#1b1b1e', clothing: 'classic_suit', clothingColor: '#212121',
    clothingSecondaryColor: '#d4af37', accessory: 'none', hat: 'none', cardBackground: 'alley',
  },
});

async function main() {
  // 0) A migração 002 está no banco?
  const col = await rest('/rest/v1/players?select=duels_won&limit=1', { key: SRV });
  const tab = await rest('/rest/v1/duels?select=id&limit=1', { key: SRV });
  if (col.status !== 200 || tab.status !== 200) {
    console.error('A migração 002 ainda não foi aplicada no Supabase (colar 002_duelos_e_ranking.sql no SQL Editor).');
    process.exit(3);
  }

  const sufixo = rand();
  const A = await criarUsuario('a');
  const B = await criarUsuario('b');
  const nomeA = `E2E Alfa ${sufixo}`;
  const nomeB = `E2E Beta ${sufixo}`;

  // 1) sem login / token inválido
  check('sem login: recusado', (await api(null, { op: 'me' })).status === 401);
  check('token inválido: recusado', (await api('token-falso', { op: 'me' })).status === 401);

  // 2) criar personagens
  check('A ainda não tem personagem', (await api(A.token, { op: 'me' })).body.exists === false);
  const cA = await api(A.token, { op: 'create', character: personagem(nomeA, 'carrasco') });
  check('A cria o personagem', cA.status === 200 && cA.body.save?.level === 1, `status ${cA.status}`);
  const dupl = await api(B.token, { op: 'create', character: personagem(nomeA.toUpperCase(), 'muralha') });
  check('nome repetido (maiúscula diferente) é recusado', dupl.status === 409 && dupl.body.error === 'nome_em_uso', `status ${dupl.status}`);
  const cB = await api(B.token, { op: 'create', character: personagem(nomeB, 'muralha') });
  check('B cria o personagem', cB.status === 200, `status ${cB.status}`);
  const again = await api(A.token, { op: 'create', character: personagem(`Outro ${sufixo}`, 'carrasco') });
  check('A não cria um segundo personagem', again.status === 409);

  // 3) salvar e recusar trapaça
  const saveA = structuredClone(cA.body.save);
  saveA.cash -= 100;
  const ok = await api(A.token, { op: 'save', save: saveA });
  check('save honesto é aceito', ok.status === 200, `status ${ok.status}`);
  const cheat = structuredClone(cA.body.save);
  cheat.cash = 99999999;
  const bad = await api(A.token, { op: 'save', save: cheat });
  check('cash inflado é recusado', bad.status === 422 && bad.body.error === 'save_recusado', `status ${bad.status}`);
  const lvl = structuredClone(cA.body.save);
  lvl.level = 90;
  lvl.points.attack += 4 * 89;
  check('nível 90 em personagem novo é recusado', (await api(A.token, { op: 'save', save: lvl })).status === 422);

  // 4) o banco não deixa o navegador escrever direto
  const direto = await rest(`/rest/v1/players?id=eq.${A.id}`, { method: 'PATCH', token: A.token, body: { level: 99 } });
  const lido = await rest(`/rest/v1/players?select=level&id=eq.${A.id}`, { token: A.token });
  check('A não consegue mudar o nível direto no banco', lido.json?.[0]?.level === 1, `PATCH status ${direto.status}`);
  const ins = await rest('/rest/v1/duels', { method: 'POST', token: A.token, body: { attacker_id: A.id, defender_id: B.id, winner_id: A.id, seed: 1, rounds: 1 } });
  check('A não consegue inserir duelo direto no banco', ins.status >= 400, `status ${ins.status}`);

  // 5) ranking: A vê os dois, sem dado privado
  const rank = await rest(`/rest/v1/public_players?select=*&id=in.(${A.id},${B.id})&order=respect.desc`, { token: A.token });
  const ids = Array.isArray(rank.json) ? rank.json.map(r => r.id) : [];
  check('ranking mostra A e B', rank.status === 200 && ids.includes(A.id) && ids.includes(B.id), `linhas ${ids.length}`);
  const cols = rank.json?.[0] ? Object.keys(rank.json[0]) : [];
  check('ranking não expõe "save"', !cols.includes('save') && cols.includes('duels_won') && cols.includes('weapon_id'));

  // 6) duelo: reforço A pelo servidor (admin) para a vitória ser certa
  const rowA = (await rest(`/rest/v1/players?select=save&id=eq.${A.id}`, { key: SRV })).json[0].save;
  rowA.points.attack += 600; rowA.points.life += 600; rowA.trainedPoints.attack += 600; rowA.trainedPoints.life += 600;
  await rest(`/rest/v1/players?id=eq.${A.id}`, { method: 'PATCH', key: SRV, body: { save: rowA } });

  const d = await api(A.token, { op: 'duel', opponentId: B.id });
  check('duelo roda no servidor e A vence', d.status === 200 && d.body.won === true && Array.isArray(d.body.events) && d.body.events.length > 0, `status ${d.status}`);
  check('prêmio pago ao vencedor', d.body.rewards?.cash > 0 && d.body.rewards?.respect === 25);
  const depois = (await rest(`/rest/v1/public_players?select=respect,duels_won,duels_lost&id=in.(${A.id},${B.id})`, { token: A.token })).json || [];
  const byId = Object.fromEntries((await rest(`/rest/v1/public_players?select=id,respect,duels_won,duels_lost&id=in.(${A.id},${B.id})`, { token: A.token })).json.map(r => [r.id, r]));
  check('placar do ranking atualizado (A 1V, B 1D)', byId[A.id]?.duels_won === 1 && byId[B.id]?.duels_lost === 1 && depois.length === 2);
  check('respeito de A subiu e o de B não mudou', byId[A.id]?.respect === 145 && byId[B.id]?.respect === 120, `A=${byId[A.id]?.respect} B=${byId[B.id]?.respect}`);
  const d2 = await api(A.token, { op: 'duel', opponentId: B.id });
  check('segundo duelo seguido contra o mesmo rival é recusado (espera)', d2.status === 429 && d2.body.error === 'espera', `status ${d2.status}`);
  const meD = await rest('/rest/v1/duels?select=id', { token: B.token });
  check('B (desafiado) vê o duelo no próprio histórico', Array.isArray(meD.json) && meD.json.length === 1);
  const self = await api(A.token, { op: 'duel', opponentId: A.id });
  check('não duela contra si mesmo', self.status === 429 && self.body.error === 'si_mesmo');
}

try {
  await main();
} catch (e) {
  console.error('Erro no teste:', e instanceof Error ? e.message : e);
  resultados.push(false);
} finally {
  for (const id of criados) await rest(`/auth/v1/admin/users/${id}`, { method: 'DELETE', key: SRV });
  console.log(`Usuários de teste apagados: ${criados.length}`);
}
const falhas = resultados.filter(r => !r).length;
console.log(`\n${resultados.length - falhas} de ${resultados.length} verificações OK`);
process.exit(falhas ? 1 : 0);
