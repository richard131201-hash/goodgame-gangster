import { defineConfig, loadEnv, type Plugin } from 'vite';
import { handleGameRequest } from './src/server/gateway.js';

/**
 * Só no `npm run dev`: atende POST /api/game com o MESMO código da função da Vercel
 * (src/server), lendo as chaves do .env.local. No site publicado quem atende é api/game.ts.
 */
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api-game',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/game', (req, res) => {
        let body = '';
        req.on('data', c => (body += c));
        req.on('end', async () => {
          const out = await handleGameRequest(
            req.method ?? 'GET',
            typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
            body,
            env,
          );
          res.statusCode = out.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(out.body));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // lê .env.local; nunca é impresso
  return { plugins: [devApi(env)] };
});
