import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const soulDir = path.resolve('../souls/engine-feature-test');

// ensure TypeScript files with relative imports compile correctly
// and their dependencies use .mjs extension

test('compile TypeScript with relative imports', async () => {
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-compile-'));
  const origTmp = process.env.TMPDIR;
  process.env.TMPDIR = tmpBase;
  const { loadProcess } = await import('../cli.js');
  await loadProcess(soulDir);
  const dirs = await fs.readdir(tmpBase);
  assert.equal(dirs.length, 1);
  const [dir] = dirs;
  const stepFiles = await fs.readdir(path.join(tmpBase, dir, 'cognitiveSteps'));
  process.env.TMPDIR = origTmp;
  assert.ok(stepFiles.includes('externalDialog.mjs'));
});

