import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import { ASSET_DIR, assetPath, buildToGlb, checkDefinition, listAssets } from './src/pipeline.js';

/** Dev-server API: list assets and build one to GLB in Node, fresh on every file change. */
function forgeApi(): Plugin {
  let server: ViteDevServer;
  return {
    name: 'forge-api',
    configureServer(s) {
      server = s;
      s.watcher.add(ASSET_DIR);
      s.watcher.on('change', (file) => {
        if (file.endsWith('.ts')) s.ws.send({ type: 'custom', event: 'forge:changed', data: { file } });
      });
      s.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        if (url.pathname === '/api/assets') {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(listAssets()));
          return;
        }
        const m = /^\/api\/build\/([\w-]+)\.glb$/.exec(url.pathname);
        if (!m) return next();
        const name = m[1]!;
        try {
          const mod = await server.ssrLoadModule(assetPath(name));
          const fast = url.searchParams.has('fast');
          const { result, glb } = await buildToGlb(
            checkDefinition(mod, name),
            assetPath(name),
            fast ? 0 : undefined,
          );
          res.setHeader('content-type', 'model/gltf-binary');
          res.setHeader('x-forge-stats', encodeURIComponent(JSON.stringify(result.stats)));
          res.end(Buffer.from(glb));
        } catch (error) {
          const e = error as Error;
          server.ssrFixStacktrace(e);
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain');
          res.end(`${e.message}\n\n${e.stack ?? ''}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [forgeApi()],
  // Read-only node_modules (benchmark containers) need the dependency cache elsewhere.
  ...(process.env.FORGE_VITE_CACHE ? { cacheDir: process.env.FORGE_VITE_CACHE } : {}),
  server: { host: '127.0.0.1' },
  build: { rollupOptions: { input: ['index.html', 'render.html'] } },
});
