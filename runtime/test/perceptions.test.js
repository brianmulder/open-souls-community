import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager, usePerceptions } from '../index.js';

const checkProcess = async ({ workingMemory }) => {
  const { speak } = useActions();
  const { wait } = useProcessManager();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  await wait(30);
  speak(`${invokingPerception.action}:${pendingPerceptions.current.length}`);
  return workingMemory;
};

test('invokingPerception and pendingPerceptions are tracked', async () => {
  const runtime = createRuntime({ initialProcess: checkProcess, soulName: 'Test' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  const first = runtime.dispatch({ action: 'start', name: 'User', content: 'hi' });
  setTimeout(() => runtime.dispatch({ action: 'poke', name: 'User', content: 'yo' }), 10);
  await first;
  await new Promise(res => setTimeout(res, 50));

  assert.deepEqual(says, ['start:1', 'poke:0']);
});
