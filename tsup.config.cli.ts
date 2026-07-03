import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: 'esm',
  outDir: 'dist-cli',
  platform: 'node',
  clean: true,
  minify: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
