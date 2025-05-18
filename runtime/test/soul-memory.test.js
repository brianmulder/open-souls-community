import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useSoulMemory, createPerception } from '../index.js';

const proc = async ({ workingMemory }) => {
  const { act } = useActions();
  const mem = useSoulMemory('flag', false);
  act({ type: 'utterance', payload: String(mem.current), ts: Date.now() });
  mem.current = true;
  return workingMemory;
};

test('useSoulMemory persists across invocations', async () => {
  const runtime = createRuntime({ initialProcess: proc, soulName: 'MemTest' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));
  await runtime.ingestPerception(createPerception('start', 'hi'));
  await runtime.ingestPerception(createPerception('again', 'hi'));
  assert.deepEqual(acts, ['false', 'true']);
});
