import { brotliCompressSync, gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const distDir = join(root, 'dist');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(js|css|html)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(distDir);

for (const file of files) {
  const buf = readFileSync(file);
  const br = brotliCompressSync(buf);
  const gz = gzipSync(buf);
  writeFileSync(file + '.br', br);
  writeFileSync(file + '.gz', gz);
  const ratio = ((1 - br.length / buf.length) * 100).toFixed(0);
  console.log(`  ${file.split('/').pop()} (${ratio}% brotli savings)`);
}

console.log(`\nCompressed ${files.length} files`);
