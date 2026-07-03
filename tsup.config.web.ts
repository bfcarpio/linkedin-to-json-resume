import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'src/main.ts',
  },
  format: 'esm',
  target: 'es2020',
  minify: true,
  clean: true,
  splitting: false,
  noExternal: ['fflate'],
  platform: 'browser',
});