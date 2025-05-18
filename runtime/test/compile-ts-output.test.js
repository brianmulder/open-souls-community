import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const soulDir = path.resolve('../souls/empty-soul');

test('compiled TypeScript uses .mjs extension', async () => {
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'compile-test-'));
  const origTmp = process.env.TMPDIR;
  process.env.TMPDIR = tmpBase;
  const { loadProcess } = await import('../cli.js');
  await loadProcess(soulDir);
  const dirs = await fs.readdir(tmpBase);
  assert.equal(dirs.length, 1);
  const files = await fs.readdir(path.join(tmpBase, dirs[0]));
  process.env.TMPDIR = origTmp;
  assert.ok(files.some(f => f.endsWith('.mjs')));
});
