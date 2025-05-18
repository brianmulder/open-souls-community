import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import * as ts from 'typescript';
import { createRuntime, ChatMessageRoleEnum } from '../index.js';

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

  const tsPath = path.resolve('../souls/empty-soul/soul/initialProcess.ts');
  const tsSource = await fs.readFile(tsPath, 'utf8');
  const runtimeUrl = pathToFileURL(path.resolve('index.js')).href;
  const replaced = tsSource.replace('@opensouls/local-engine', runtimeUrl);
  const jsSource = ts.transpileModule(replaced, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'golem-'));
  const jsPath = path.join(tmpDir, 'initialProcess.js');
  await fs.writeFile(jsPath, jsSource);

  const { default: initialProcess } = await import(pathToFileURL(jsPath).href);
  const runtime = createRuntime({ initialProcess, soulName: 'Golem' });
  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  await runtime.dispatch({ action: 'said', name: 'User', content: 'hi' });

  assert.ok(fetchCalled, 'OpenAI API should be called');
  assert.deepEqual(says, ['Hello world']);
  assert.equal(runtime.workingMemory.memories.length, 2);
  const [user, assistant] = runtime.workingMemory.memories;
  assert.equal(user.role, ChatMessageRoleEnum.User);
  assert.equal(assistant.role, ChatMessageRoleEnum.Assistant);
  assert.equal(assistant.content, 'Hello world');

  global.fetch = originalFetch;
});
