import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { createRuntime, loadEnvironment, loadBlueprint, ChatMessageRoleEnum, $$ } from '../index.js';
import { loadProcess } from '../cli.js';

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

test('environment variables are loaded and templated', async () => {
  const env = await loadEnvironment(soulDir);
  const blueprint = await loadBlueprint(soulDir, env);
  const initialProcess = await loadProcess(soulDir);
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
