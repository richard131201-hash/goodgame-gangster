// Teste de segurança do banco REAL (migração 001): prova que um jogador não lê nem grava dado de outro.
// Uso: node --env-file=.env.local supabase/tests/rls-check.mjs
// Cria 2 usuários de teste, testa e APAGA os dois no fim. Nunca imprime chaves nem tokens.

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

async function http(path, { method = 'GET', key = ANON, token, body, prefer } = {}) {
  const headers = { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${URL_}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await r.json(); } catch { /* corpo vazio */ }
  return { status: r.status, json };
}

const criados = [];
async function criarUsuario(rotulo) {
  const email = `teste-rls-${rotulo}-${rand()}@example.com`;
  const password = `Tt!${rand()}${rand()}${rand()}9`;
  const c = await http('/auth/v1/admin/users', { method: 'POST', key: SRV, body: { email, password, email_confirm: true } });
  if (c.status >= 300) throw new Error(`Não criou usuário ${rotulo}: status ${c.status}`);
  const id = c.json.id;
  criados.push(id);
  const s = await http('/auth/v1/token?grant_type=password', { method: 'POST', key: ANON, body: { email, password } });
  if (s.status !== 200) throw new Error(`Login do usuário ${rotulo} falhou: status ${s.status}`);
  return { id, token: s.json.access_token };
}

async function main() {
  // 0) a tabela existe e o servidor (service_role) consegue acessá-la
  const t0 = await http('/rest/v1/players?select=id&limit=1', { key: SRV });
  check('tabela players existe e o servidor tem acesso', t0.status === 200, `status ${t0.status}`);
  if (t0.status !== 200) throw new Error('Sem a tabela não há o que testar. Rode a migração 001.');

  // 1) sem login, nada é visível
  const a1 = await http('/rest/v1/players?select=id&limit=1');
  check('visitante sem login NÃO lê players', a1.status >= 400, `status ${a1.status}`);
  const a2 = await http('/rest/v1/public_players?select=id&limit=1');
  check('visitante sem login NÃO lê public_players', a2.status >= 400, `status ${a2.status}`);

  // 2) dois jogadores de teste, cada um com uma linha criada PELO SERVIDOR
  const A = await criarUsuario('a');
  const B = await criarUsuario('b');
  const nomeA = `TesteA${rand()}`.slice(0, 20);
  const nomeB = `TesteB${rand()}`.slice(0, 20);
  for (const [u, nome] of [[A, nomeA], [B, nomeB]]) {
    const ins = await http('/rest/v1/players', {
      method: 'POST', key: SRV, prefer: 'return=minimal',
      body: { id: u.id, name: nome, style: 'carrasco', appearance: { teste: true }, save: { segredo: 'so-do-dono' } },
    });
    check(`servidor cria jogador ${nome}`, ins.status === 201, `status ${ins.status}`);
  }

  // 3) o jogador A (logado) só enxerga a PRÓPRIA linha completa
  const own = await http('/rest/v1/players?select=id,save', { token: A.token });
  check('A lê players: só a própria linha', own.status === 200 && Array.isArray(own.json) && own.json.length === 1 && own.json[0].id === A.id, `linhas ${Array.isArray(own.json) ? own.json.length : '?'}`);
  const outro = await http(`/rest/v1/players?select=id,save&id=eq.${B.id}`, { token: A.token });
  check('A NÃO lê a linha de B em players', outro.status === 200 && Array.isArray(outro.json) && outro.json.length === 0, `linhas ${Array.isArray(outro.json) ? outro.json.length : '?'}`);

  // 4) A vê B na visão pública, mas sem dados privados
  const pub = await http(`/rest/v1/public_players?select=*&id=in.(${A.id},${B.id})`, { token: A.token });
  const ids = Array.isArray(pub.json) ? pub.json.map(r => r.id) : [];
  check('A vê A e B em public_players (ranking)', pub.status === 200 && ids.includes(A.id) && ids.includes(B.id), `linhas ${ids.length}`);
  const colunas = Array.isArray(pub.json) && pub.json[0] ? Object.keys(pub.json[0]) : [];
  check('public_players NÃO expõe o campo privado "save"', pub.status === 200 && !colunas.includes('save'));

  // 5) A não consegue escrever nada direto
  const upd = await http(`/rest/v1/players?id=eq.${B.id}`, { method: 'PATCH', token: A.token, prefer: 'return=representation', body: { level: 99 } });
  check('A NÃO consegue alterar B', upd.status >= 400 || (Array.isArray(upd.json) && upd.json.length === 0), `status ${upd.status}`);
  const updSelf = await http(`/rest/v1/players?id=eq.${A.id}`, { method: 'PATCH', token: A.token, prefer: 'return=representation', body: { level: 99, respect: 999999 } });
  check('A NÃO consegue alterar a si mesmo direto (trapaça)', updSelf.status >= 400 || (Array.isArray(updSelf.json) && updSelf.json.length === 0), `status ${updSelf.status}`);
  const insA = await http('/rest/v1/players', { method: 'POST', token: A.token, prefer: 'return=minimal', body: { id: crypto.randomUUID(), name: `Falso${rand()}`, style: 'muralha', appearance: {}, save: {} } });
  check('A NÃO consegue criar jogador direto', insA.status >= 400, `status ${insA.status}`);
  const del = await http(`/rest/v1/players?id=eq.${B.id}`, { method: 'DELETE', token: A.token, prefer: 'return=representation' });
  check('A NÃO consegue apagar B', del.status >= 400 || (Array.isArray(del.json) && del.json.length === 0), `status ${del.status}`);

  // 6) confirmação pelo servidor: nada de B nem de A mudou
  const conf = await http(`/rest/v1/players?select=id,level,respect&id=in.(${A.id},${B.id})`, { key: SRV });
  const intactos = Array.isArray(conf.json) && conf.json.length === 2 && conf.json.every(r => r.level === 1 && r.respect === 120);
  check('dados de A e B continuam intactos (nível 1, respeito 120)', intactos);
}

let fatal = null;
try { await main(); } catch (e) { fatal = e; console.error('ERRO:', e.message); }

// Limpeza: apaga os usuários de teste (a linha em players some junto, por cascata)
for (const id of criados) {
  const d = await http(`/auth/v1/admin/users/${id}`, { method: 'DELETE', key: SRV });
  console.log(`limpeza: usuário de teste apagado (status ${d.status})`);
}
if (criados.length) {
  const resto = await http(`/rest/v1/players?select=id&id=in.(${criados.join(',')})`, { key: SRV });
  check('limpeza: nenhuma linha de teste sobrou em players', Array.isArray(resto.json) && resto.json.length === 0);
}

const falhas = resultados.filter(r => !r).length;
console.log(`\nResumo: ${resultados.length - falhas} ok, ${falhas} falha(s)${fatal ? ', com erro fatal' : ''}.`);
process.exit(falhas || fatal ? 1 : 0);
