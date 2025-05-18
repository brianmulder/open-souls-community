import path from 'path';
import readline from 'readline';
import fs from 'fs/promises';
import os from 'os';
import * as ts from 'typescript';
import { createRuntime, loadEnvironment, loadBlueprint, createPerception } from './index.js';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function compileTs(file) {
  const source = await fs.readFile(file, 'utf8');
  const runtimeUrl = pathToFileURL(path.resolve(__dirname, 'index.js')).href;
  const replaced = source.replace('@opensouls/local-engine', runtimeUrl);
  const jsSource = ts.transpileModule(replaced, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'soul-'));
  const jsPath = path.join(tmpDir, path.basename(file, '.ts') + '.js');
  await fs.writeFile(jsPath, jsSource);
  return jsPath;
}

export async function loadProcess(soulDir) {
  const jsPath = path.resolve(soulDir, 'soul', 'initialProcess.js');
  const tsPath = path.resolve(soulDir, 'soul', 'initialProcess.ts');
  let modPath;
  if (await exists(jsPath)) {
    modPath = jsPath;
  } else if (await exists(tsPath)) {
    modPath = await compileTs(tsPath);
  } else {
    throw new Error('initialProcess.ts or initialProcess.js not found');
  }
  return (await import(pathToFileURL(modPath).href)).default;
}

export async function loadSubprocesses(soulDir) {
  const dir = path.resolve(soulDir, 'soul', 'subprocesses');
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) return [];
  } catch {
    return [];
  }
  const files = (await fs.readdir(dir))
    .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
    .sort();
  const procs = [];
  for (const file of files) {
    let filePath = path.join(dir, file);
    if (file.endsWith('.ts')) {
      filePath = await compileTs(filePath);
    }
    const mod = await import(pathToFileURL(filePath).href);
    procs.push(mod.default);
  }
  return procs;
}

async function main() {
  const soulDir = process.argv[2];
  if (!soulDir) {
    console.error('Usage: node runtime/cli.js <soul-directory>');
    process.exit(1);
  }
  const initialProcess = await loadProcess(soulDir);
  const subprocesses = await loadSubprocesses(soulDir);
  const env = await loadEnvironment(soulDir);
  const blueprint = await loadBlueprint(soulDir, env);
  const runtime = createRuntime({
    initialProcess,
    subprocesses,
    soulName: path.basename(soulDir),
    env,
    blueprint,
    storeDir: path.join(soulDir, '.store')
  });
  runtime.on('act', action => {
    if (action.type === 'utterance') {
      console.log(path.basename(soulDir), 'says:', action.payload);
    } else {
      console.log(path.basename(soulDir), 'action:', JSON.stringify(action));
    }
  });
  runtime.on('log', (...args) => console.log('[log]', ...args));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt('> ');
  rl.prompt();
  rl.on('line', async line => {
    await runtime.ingestPerception(createPerception('utterance', line));
    rl.prompt();
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
