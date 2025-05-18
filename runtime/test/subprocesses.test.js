import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager, createPerception } from '../index.js';

const main = async ({ workingMemory }) => {
  const { act } = useActions();
  act({ type: 'utterance', payload: 'main', ts: Date.now() });
  return workingMemory;
};

const sub1 = async ({ workingMemory }) => {
  const { act } = useActions();
  act({ type: 'utterance', payload: 'sub1', ts: Date.now() });
  return workingMemory;
};

test('subprocess runs after process', async () => {
  const runtime = createRuntime({ initialProcess: main, soulName: 'Sub', subprocesses: [sub1] });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));
  await runtime.ingestPerception(createPerception('start', 'hi'));
  await new Promise(res => setTimeout(res, 10));
  assert.deepEqual(acts, ['main', 'sub1']);
});

const waitSub = async ({ workingMemory }) => {
  const { act } = useActions();
  const { wait } = useProcessManager();
  await wait(20);
  act({ type: 'utterance', payload: 'waited', ts: Date.now() });
  return workingMemory;
};

const sub2 = async ({ workingMemory }) => {
  const { act } = useActions();
  act({ type: 'utterance', payload: 'sub2', ts: Date.now() });
  return workingMemory;
};

test('subprocess chain stops on new perception', async () => {
  const runtime = createRuntime({ initialProcess: main, soulName: 'Sub', subprocesses: [waitSub, sub2] });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));
  const first = runtime.ingestPerception(createPerception('start', 'hi'));
  setTimeout(() => runtime.ingestPerception(createPerception('next', 'yo')), 10);
  await first;
  await new Promise(res => setTimeout(res, 50));
  assert.deepEqual(acts, ['main', 'waited', 'main', 'waited', 'sub2']);
});
