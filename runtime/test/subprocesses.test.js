import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, useActions, useProcessManager } from '../index.js';

const main = async ({ workingMemory }) => {
  const { speak } = useActions();
  speak('main');
  return workingMemory;
};

const sub1 = async ({ workingMemory }) => {
  const { speak } = useActions();
  speak('sub1');
  return workingMemory;
};

test('subprocess runs after process', async () => {
  const runtime = createRuntime({ initialProcess: main, soulName: 'Sub', subprocesses: [sub1] });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));
  await runtime.dispatch({ action: 'start', name: 'User', content: 'hi' });
  await new Promise(res => setTimeout(res, 10));
  assert.deepEqual(says, ['main', 'sub1']);
});

const waitSub = async ({ workingMemory }) => {
  const { speak } = useActions();
  const { wait } = useProcessManager();
  await wait(20);
  speak('waited');
  return workingMemory;
};

const sub2 = async ({ workingMemory }) => {
  const { speak } = useActions();
  speak('sub2');
  return workingMemory;
};

test('subprocess chain stops on new perception', async () => {
  const runtime = createRuntime({ initialProcess: main, soulName: 'Sub', subprocesses: [waitSub, sub2] });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));
  const first = runtime.dispatch({ action: 'start', name: 'User', content: 'hi' });
  setTimeout(() => runtime.dispatch({ action: 'next', name: 'User', content: 'yo' }), 10);
  await first;
  await new Promise(res => setTimeout(res, 50));
  assert.deepEqual(says, ['main', 'waited', 'main', 'waited', 'sub2']);
});
