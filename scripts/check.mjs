#!/usr/bin/env node
// Run with: node scripts/check.mjs
// Checks every .ts/.tsx file for syntax errors using esbuild's transform API.
// Completes in ~2 seconds. Run this before npm run dev to catch truncation issues early.

import { transform } from 'esbuild';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
      files.push(...walk(full));
    } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk('src');
let errors = 0;

await Promise.all(
  files.map(async (file) => {
    const code = readFileSync(file, 'utf8');
    const loader = file.endsWith('.tsx') ? 'tsx' : 'ts';
    try {
      await transform(code, { loader, target: 'es2020' });
    } catch (err) {
      errors++;
      const msgs = err.errors ?? [];
      if (msgs.length > 0) {
        for (const msg of msgs) {
          const loc = msg.location;
          console.error(`\n✘ ${file}:${loc?.line ?? '?'}:${loc?.column ?? '?'}`);
          console.error(`  ${msg.text}`);
          if (loc?.lineText) console.error(`  ${loc.lineText}`);
        }
      } else {
        console.error(`\n✘ ${file}: ${err.message}`);
      }
    }
  }),
);

if (errors === 0) {
  console.log(`✓ All ${files.length} files OK`);
} else {
  console.error(`\n${errors} file(s) have errors. Fix them before running npm run dev.`);
  process.exit(1);
}
