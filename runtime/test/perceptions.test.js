import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager, usePerceptions, createPerception } from '../index.js';

const checkProcess = async ({ workingMemory }) => {
  const { act } = useActions();
  const { wait } = useProcessManager();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  await wait(30);
  act({ type: 'utterance', payload: `${invokingPerception.type}:${pendingPerceptions.current.length}`, ts: Date.now() });
  return workingMemory;
};

test('invokingPerception and pendingPerceptions are tracked', async () => {
  const runtime = createRuntime({ initialProcess: checkProcess, soulName: 'Test' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));

  const first = runtime.ingestPerception(createPerception('start', 'hi'));
  setTimeout(() => runtime.ingestPerception(createPerception('poke', 'yo')), 10);
  await first;
  await new Promise(res => setTimeout(res, 50));

  assert.deepEqual(acts, ['start:1', 'poke:0']);
});
