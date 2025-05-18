import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { createRuntime, ChatMessageRoleEnum, createPerception } from '../index.js';
import { loadProcess } from '../cli.js';

test('runtime hosts the empty soul', async () => {
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

  const soulDir = path.resolve('../souls/empty-soul');
  const initialProcess = await loadProcess(soulDir);
  const runtime = createRuntime({ initialProcess, soulName: 'Golem' });
  const acts = [];
  runtime.on('act', a => acts.push(a.payload));

  await runtime.ingestPerception(createPerception('utterance', 'hi'));

  assert.ok(fetchCalled, 'OpenAI API should be called');
  assert.deepEqual(acts, ['Hello world']);
  assert.equal(runtime.workingMemory.memories.length, 2);
  const [user, assistant] = runtime.workingMemory.memories;
  assert.equal(user.role, ChatMessageRoleEnum.User);
  assert.equal(assistant.role, ChatMessageRoleEnum.Assistant);
  assert.equal(assistant.content, 'Hello world');

  global.fetch = originalFetch;
});
