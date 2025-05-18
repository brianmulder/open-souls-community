import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createRuntime, useActions, useSoulStore, createPerception } from '../index.js';

const proc = async ({ workingMemory }) => {
  const { act } = useActions();
  const store = useSoulStore();
  const count = (await store.fetch('count')) || 0;
  await store.set('count', count + 1);
  const updated = await store.fetch('count');
  act({ type: 'utterance', payload: String(updated), ts: Date.now() });
  return workingMemory;
};

test('useSoulStore persists to disk', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'store-'));
  const runtime1 = createRuntime({ initialProcess: proc, soulName: 'Store', storeDir: dir });
  const acts1 = [];
  runtime1.on('act', a => acts1.push(a.payload));
  await runtime1.ingestPerception(createPerception('start', 'hi'));
  assert.deepEqual(acts1, ['1']);

  const runtime2 = createRuntime({ initialProcess: proc, soulName: 'Store', storeDir: dir });
  const acts2 = [];
  runtime2.on('act', a => acts2.push(a.payload));
  await runtime2.ingestPerception(createPerception('start', 'hi'));
  assert.deepEqual(acts2, ['2']);
});

