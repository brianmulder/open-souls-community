import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions } from '../index.js';

const handlePoke = async ({ workingMemory }) => {
  const { speak } = useActions();
  speak('poke event');
  return workingMemory;
};

let scheduledId;
const scheduler = async ({ workingMemory }) => {
  const { scheduleEvent } = useActions();
  scheduledId = scheduleEvent({ in: 0.05, perception: { action: 'poke', content: 'poke', name: 'Test' }, process: handlePoke });
  return workingMemory;
};

test('scheduled event executes after delay', async () => {
  const runtime = createRuntime({ initialProcess: scheduler, soulName: 'Test' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  await runtime.dispatch({ action: 'start', content: 'go', name: 'Tester' });
  assert.equal(runtime.getPendingEvents().length, 1);

  await new Promise(res => setTimeout(res, 80));

  assert.equal(runtime.getPendingEvents().length, 0);
  assert.deepEqual(says, ['poke event']);
});

test('scheduled event can be cancelled', async () => {
  const runtime = createRuntime({ initialProcess: scheduler, soulName: 'Test' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  await runtime.dispatch({ action: 'start', content: 'go', name: 'Tester' });
  runtime.cancelScheduledEvent(scheduledId);
  assert.equal(runtime.getPendingEvents().length, 0);

  await new Promise(res => setTimeout(res, 80));

  assert.deepEqual(says, []);
});
