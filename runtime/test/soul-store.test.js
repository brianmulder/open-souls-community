import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createRuntime, useActions, useSoulStore } from '../index.js';

const proc = async ({ workingMemory }) => {
  const { speak } = useActions();
  const store = useSoulStore();
  const count = (await store.fetch('count')) || 0;
  await store.set('count', count + 1);
  const updated = await store.fetch('count');
  speak(String(updated));
  return workingMemory;
};

test('useSoulStore persists to disk', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'store-'));
  const runtime1 = createRuntime({ initialProcess: proc, soulName: 'Store', storeDir: dir });
  const says1 = [];
  runtime1.on('says', ({ content }) => says1.push(content));
  await runtime1.dispatch({ action: 'start', name: 'User', content: 'hi' });
  assert.deepEqual(says1, ['1']);

  const runtime2 = createRuntime({ initialProcess: proc, soulName: 'Store', storeDir: dir });
  const says2 = [];
  runtime2.on('says', ({ content }) => says2.push(content));
  await runtime2.dispatch({ action: 'start', name: 'User', content: 'hi' });
  assert.deepEqual(says2, ['2']);
});

