import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager } from '../index.js';

const processB = async ({ workingMemory }) => {
  const { previousMentalProcess, invocationCount } = useProcessManager();
  const { speak } = useActions();
  speak(`B ${invocationCount} prev:${previousMentalProcess === processA}`);
  return workingMemory;
};

const processA = async ({ workingMemory }) => {
  const { invocationCount, setNextProcess } = useProcessManager();
  const { speak } = useActions();
  speak(`A ${invocationCount}`);
  if (invocationCount === 0) {
    setNextProcess(processB);
  }
  return workingMemory;
};

test('previousMentalProcess and invocationCount are tracked', async () => {
  const runtime = createRuntime({ initialProcess: processA, soulName: 'Test' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  assert.equal(runtime.previousProcess, undefined);

  await runtime.dispatch({ action: 'start', name: 'User', content: 'hi' });
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 0);

  await runtime.dispatch({ action: 'cont', name: 'User', content: 'again' });
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 1);

  await runtime.dispatch({ action: 'cont', name: 'User', content: 'again' });
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 2);

  assert.deepEqual(says, ['A 0', 'B 0 prev:true', 'B 1 prev:true']);
});
