import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, createPerception } from '../index.js';

const handlePoke = async ({ workingMemory }) => {
  const { act } = useActions();
  act({ type: 'utterance', payload: 'poke event', ts: Date.now() });
  return workingMemory;
};

let scheduledId;
const scheduler = async ({ workingMemory }) => {
  const { scheduleEvent } = useActions();
  scheduledId = scheduleEvent({ in: 0.05, perception: createPerception('poke', 'poke'), process: handlePoke });
  return workingMemory;
};

test('scheduled event executes after delay', async () => {
  const runtime = createRuntime({ initialProcess: scheduler, soulName: 'Test' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));

  await runtime.ingestPerception(createPerception('start', 'go'));
  assert.equal(runtime.getPendingEvents().length, 1);

  await new Promise(res => setTimeout(res, 80));

  assert.equal(runtime.getPendingEvents().length, 0);
  assert.deepEqual(acts, ['poke event']);
});

test('scheduled event can be cancelled', async () => {
  const runtime = createRuntime({ initialProcess: scheduler, soulName: 'Test' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));

  await runtime.ingestPerception(createPerception('start', 'go'));
  runtime.cancelScheduledEvent(scheduledId);
  assert.equal(runtime.getPendingEvents().length, 0);

  await new Promise(res => setTimeout(res, 80));

  assert.deepEqual(acts, []);
});
