import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleGameRequest } from '../src/server/gateway.js';

/**
 * Função da Vercel: POST /api/game  (corpo JSON { op: 'me' | 'create' | 'save' | 'duel', ... }).
 * Toda a lógica está em src/server; aqui só se lê a requisição e se escreve a resposta.
 * Variáveis de ambiente (nunca no repositório): SUPABASE_URL (ou VITE_SUPABASE_URL) e
 * SUPABASE_SERVICE_ROLE_KEY (Secret).
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 300_000) {
        reject(new Error('corpo grande demais'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  let bodyText = '';
  try {
    bodyText = await readBody(req);
  } catch {
    res.statusCode = 413;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'corpo_grande', message: 'Requisição grande demais.' }));
    return;
  }
  const out = await handleGameRequest(
    req.method ?? 'GET',
    typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    bodyText,
    process.env,
  );
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(out.body));
}
