import test from 'node:test';
import assert from 'node:assert/strict';
import { callLLM, createCognitiveStep, WorkingMemory, ChatMessageRoleEnum } from '../index.js';
import { Readable } from 'stream';

process.env.OPENAI_API_KEY = 'test';

function mockFetchSSE(tokens) {
  return async function () {
    const data = tokens.map(t => `data: {\"choices\":[{\"delta\":{\"content\":${JSON.stringify(t)}}}]}\n`).join('') + 'data: [DONE]\n';
    const body = Readable.from(Buffer.from(data));
    return {
      ok: true,
      body,
      json: async () => ({}),
    };
  };
}

test('callLLM streams tokens', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchSSE(['Hello', ' world']);
  const { stream, promise } = await callLLM([], { stream: true });
  const parts = [];
  for await (const part of stream()) {
    parts.push(part);
  }
  const text = await promise;
  globalThis.fetch = originalFetch;
  assert.deepEqual(parts, ['Hello', ' world']);
  assert.equal(text, 'Hello world');
});

test('createCognitiveStep streaming', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchSSE(['Hi']);
  const step = createCognitiveStep(() => ({ command: 'Say hi' }));
  const memory = new WorkingMemory({ soulName: 'Tester' });
  const [updated, stream, finished] = await step(memory, { stream: true });
  const chunks = [];
  for await (const c of stream()) {
    chunks.push(c);
  }
  await finished;
  globalThis.fetch = originalFetch;
  assert.deepEqual(chunks, ['Hi']);
  assert.equal(updated.memories[updated.memories.length - 1].role, ChatMessageRoleEnum.Assistant);
  assert.equal(updated.memories[updated.memories.length - 1].content, 'Hi');
});
