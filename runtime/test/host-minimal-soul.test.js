import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, createCognitiveStep, ChatMessageRoleEnum } from '../index.js';

const step = createCognitiveStep(() => ({ command: 'Say hello' }));

const initialProcess = async ({ workingMemory }) => {
  const [mem] = await step(workingMemory);
  return mem;
};

test('runtime hosts a minimal soul', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCalled = true;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hello world' } }] })
    };
  };

  const runtime = createRuntime({ initialProcess, soulName: 'TestSoul' });
  await runtime.dispatch({ action: 'said', name: 'User', content: 'hi' });

  assert.ok(fetchCalled, 'OpenAI API should be called');
  assert.equal(runtime.workingMemory.memories.length, 3);
  const [user, system, assistant] = runtime.workingMemory.memories;
  assert.equal(user.role, ChatMessageRoleEnum.User);
  assert.equal(system.role, ChatMessageRoleEnum.System);
  assert.equal(assistant.role, ChatMessageRoleEnum.Assistant);
  assert.equal(assistant.content, 'Hello world');

  global.fetch = originalFetch;
});
