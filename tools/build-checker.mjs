import { build } from 'esbuild';
await build({
  entryPoints: ['tools/checker-entry.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'Clearwren',
  target: ['es2020'],
  outfile: 'site/assets/checker.js',
  legalComments: 'none',
});
console.log('built site/assets/checker.js');
