const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');


esbuild
  .build({
    entryPoints: ['index.ts'],
    bundle: true,
    outdir: 'dist',
    outbase: '.', 
    platform: 'node',
    sourcemap: 'inline',
    target: 'es2020'
  });