import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useSoulMemory } from '../index.js';

const proc = async ({ workingMemory }) => {
  const { speak } = useActions();
  const mem = useSoulMemory('flag', false);
  speak(String(mem.current));
  mem.current = true;
  return workingMemory;
};

test('useSoulMemory persists across invocations', async () => {
  const runtime = createRuntime({ initialProcess: proc, soulName: 'MemTest' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));
  await runtime.dispatch({ action: 'start', name: 'User', content: 'hi' });
  await runtime.dispatch({ action: 'again', name: 'User', content: 'hi' });
  assert.deepEqual(says, ['false', 'true']);
});
