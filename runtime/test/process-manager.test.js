import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager, createPerception } from '../index.js';

const processB = async ({ workingMemory }) => {
  const { previousMentalProcess, invocationCount } = useProcessManager();
  const { act } = useActions();
  act({ type: 'utterance', payload: `B ${invocationCount} prev:${previousMentalProcess === processA}`, ts: Date.now() });
  return workingMemory;
};

const processA = async ({ workingMemory }) => {
  const { invocationCount, setNextProcess } = useProcessManager();
  const { act } = useActions();
  act({ type: 'utterance', payload: `A ${invocationCount}`, ts: Date.now() });
  if (invocationCount === 0) {
    setNextProcess(processB);
  }
  return workingMemory;
};

test('previousMentalProcess and invocationCount are tracked', async () => {
  const runtime = createRuntime({ initialProcess: processA, soulName: 'Test' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));

  assert.equal(runtime.previousProcess, undefined);

  await runtime.ingestPerception(createPerception('start', 'hi'));
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 0);

  await runtime.ingestPerception(createPerception('cont', 'again'));
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 1);

  await runtime.ingestPerception(createPerception('cont', 'again'));
  assert.equal(runtime.previousProcess, processA);
  assert.equal(runtime.currentProcess, processB);
  assert.equal(runtime.invocationCount, 2);

  assert.deepEqual(acts, ['A 0', 'B 0 prev:true', 'B 1 prev:true']);
});
