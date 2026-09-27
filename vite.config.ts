import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import { ASSET_DIR, OUT_DIR, assetPath, buildToGlb, checkDefinition, listAssets } from './src/pipeline.js';

const OUT_TYPES: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.json': 'application/json',
  '.gif': 'image/gif',
  '.wav': 'audio/wav',
};

/** Serve baked files from out/ so the hamlet page can instance them. */
function serveOut(url: URL, res: import('node:http').ServerResponse): boolean {
  if (!url.pathname.startsWith('/out/')) return false;
  const rel = decodeURIComponent(url.pathname.slice('/out/'.length));
  const file = normalize(join(OUT_DIR, rel));
  if (file !== OUT_DIR && !file.startsWith(OUT_DIR + sep)) {
    res.statusCode = 403;
    res.end('forbidden');
    return true;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.statusCode = 404;
    res.end('missing');
    return true;
  }
  res.setHeader('content-type', OUT_TYPES[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
  return true;
}

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
        if (serveOut(url, res)) return;
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
  server: {
    host: '127.0.0.1',
    watch: {
      // Trial workspaces under bench/ rebuild constantly; never reload for them.
      ignored: ['**/bench/**', '**/out/**'],
    },
  },
  build: { rollupOptions: { input: ['index.html', 'render.html', 'hamlet.html', 'showcase.html'] } },
});
