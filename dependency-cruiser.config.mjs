/** @type {import('dependency-cruiser').IConfiguration} */
const config = {
  forbidden: [
    {
      name: 'contracts-are-engine-neutral',
      severity: 'error',
      from: { path: '^src/contracts' },
      to: {
        path: '^src/(?!contracts(?:/|$))|node:(?:fs|path)|@modelcontextprotocol|three',
      },
    },
    {
      name: 'domain-does-not-import-adapters',
      severity: 'error',
      from: {
        path: '^src/(?!document/browser\\.ts$)(contracts|document|geometry|assembly|fantasy-kit|scene|render|export|validation)/(?!index\\.ts$).+',
      },
      to: { path: '^src/(tools|mcp|inspector)(?:/|$)' },
    },
    {
      name: 'adapters-use-public-module-roots',
      severity: 'error',
      from: { path: '^src/(tools|mcp|inspector)(?:/|$)' },
      to: {
        path: '^src/(?!document/browser[.]ts$)(contracts|document|geometry|assembly|fantasy-kit|scene|render|export|validation)/(?!index[.]ts$).+',
      },
    },
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: { exportsFields: ['exports'] },
    reporterOptions: { dot: { collapsePattern: 'node_modules/[^/]+' } },
  },
};

export default config;
