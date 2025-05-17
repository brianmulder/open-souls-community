import path from 'path';
import readline from 'readline';
import { createRuntime, loadEnvironment, loadBlueprint } from './index.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadProcess(soulDir) {
  const procPath = path.resolve(soulDir, 'soul', 'initialProcess.js');
  return (await import(procPath)).default;
}

async function main() {
  const soulDir = process.argv[2];
  if (!soulDir) {
    console.error('Usage: node runtime/cli.js <soul-directory>');
    process.exit(1);
  }
  const initialProcess = await loadProcess(soulDir);
  const env = await loadEnvironment(soulDir);
  const blueprint = await loadBlueprint(soulDir, env);
  const runtime = createRuntime({
    initialProcess,
    soulName: path.basename(soulDir),
    env,
    blueprint
  });
  runtime.on('says', ({ content }) => {
    console.log(path.basename(soulDir), 'says:', content);
  });
  runtime.on('log', (...args) => console.log('[log]', ...args));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt('> ');
  rl.prompt();
  rl.on('line', async line => {
    await runtime.dispatch({ action: 'said', name: 'User', content: line });
    rl.prompt();
  });
}

main();
