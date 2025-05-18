import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import * as ts from 'typescript';
import { createRuntime, loadEnvironment, loadBlueprint, ChatMessageRoleEnum, $$ } from '../index.js';

const soulDir = path.resolve('../souls/env-vars');

test('blueprint markdown is expanded using env vars', async () => {
  const env = await loadEnvironment(soulDir);
  const blueprintPath = path.resolve('../souls/env-vars/soul/{{ENTITY_NAME}}.md');
  const raw = await fs.readFile(blueprintPath, 'utf8');
  globalThis.soul = { env };
  const expected = $$(raw);
  delete globalThis.soul;

  const loaded = await loadBlueprint(soulDir, env);
  assert.equal(loaded, expected);
});

async function compileProcess() {
  const tsPath = path.resolve('../souls/env-vars/soul/initialProcess.ts');
  const tsSource = await fs.readFile(tsPath, 'utf8');
  const runtimeUrl = pathToFileURL(path.resolve('index.js')).href;
  const replaced = tsSource.replace('@opensouls/local-engine', runtimeUrl);
  const jsSource = ts.transpileModule(replaced, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-'));
  const jsPath = path.join(tmpDir, 'initialProcess.js');
  await fs.writeFile(jsPath, jsSource);
  return pathToFileURL(jsPath).href;
}

test('environment variables are loaded and templated', async () => {
  const env = await loadEnvironment(soulDir);
  const blueprint = await loadBlueprint(soulDir, env);
  const procUrl = await compileProcess();
  const { default: initialProcess } = await import(procUrl);
  const runtime = createRuntime({ initialProcess, soulName: 'Env', env, blueprint });

  assert.equal(runtime.workingMemory.memories.length, 1);
  const [systemBefore] = runtime.workingMemory.memories;
  assert.equal(systemBefore.content, blueprint);

  const says = [];
  runtime.on('says', ({ content }) => says.push(content));

  await runtime.dispatch({ action: 'said', name: 'User', content: 'hi' });

  assert.deepEqual(says, ['I like alice, pumpkins.']);
  assert.equal(runtime.workingMemory.memories.length, 2);
  const [system, user] = runtime.workingMemory.memories;
  assert.equal(system.role, ChatMessageRoleEnum.System);
  assert.ok(system.content.includes('Bob'));
  assert.equal(user.role, ChatMessageRoleEnum.User);
});
