import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import os from 'os';
import crypto from 'crypto';
import { LocalStore } from './stores/localStore.js';

let currentRuntime = null;

export const z = {
  object(shape) {
    return { type: 'object', shape, describe(d) { this.description = d; return this; } };
  },
  string() {
    return { type: 'string', describe(d) { this.description = d; return this; } };
  },
  boolean() {
    return { type: 'boolean', describe(d) { this.description = d; return this; } };
  },
  array(inner) {
    return { type: 'array', inner, describe(d) { this.description = d; return this; } };
  },
  nativeEnum(choices) {
    return { type: 'enum', choices, describe(d) { this.description = d; return this; } };
  },
};

export const ChatMessageRoleEnum = {
  System: 'system',
  User: 'user',
  Assistant: 'assistant'
};

export class WorkingMemory {
  constructor({ soulName = 'Soul', memories = [] } = {}) {
    this.soulName = soulName;
    this.memories = memories.slice();
  }
  withMemory(memory) {
    return new WorkingMemory({
      soulName: this.soulName,
      memories: this.memories.concat(memory)
    });
  }
  slice(start, end) {
    return new WorkingMemory({
      soulName: this.soulName,
      memories: this.memories.slice(start, end)
    });
  }
  concat(other) {
    return new WorkingMemory({
      soulName: this.soulName,
      memories: this.memories.concat(other.memories)
    });
  }
}

export function indentNicely(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i] + (values[i] ?? '');
  }
  return result.replace(/^[ \t]+/gm, '').trim();
}

export function stripEntityAndVerb(entity, verb, text) {
  const regex = new RegExp(`^${entity} ${verb}:\\s*`, 'i');
  return text.replace(regex, '');
}

export function stripEntityAndVerbFromStream(stream) {
  return stream;
}

export function $$(text) {
  const env = globalThis.soul?.env || {};
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
    const parts = expr.split('.');
    let val = env;
    for (const p of parts) {
      val = val?.[p];
    }
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    return val ?? '';
  });
}

export async function loadEnvironment(soulDir) {
  const envPathTs = path.resolve(soulDir, 'soul', 'default.env.ts');
  const envPathJs = path.resolve(soulDir, 'soul', 'default.env.js');
  let file;
  try {
    await fs.access(envPathTs);
    file = envPathTs;
  } catch {
    try {
      await fs.access(envPathJs);
      file = envPathJs;
    } catch {
      return {};
    }
  }
  let source = await fs.readFile(file, 'utf8');
  source = source.trim();
  if (source.startsWith('export default')) {
    source = source.replace(/^export default/, '').trim();
  }
  const wrapped = `export default (${source});`;
  const tmp = path.join(os.tmpdir(), `env-${crypto.randomUUID()}.mjs`);
  const transpiled = wrapped;
  await fs.writeFile(tmp, transpiled);
  const mod = await import(pathToFileURL(tmp).href);
  await fs.unlink(tmp);
  return mod.default || {};
}

export async function loadBlueprint(soulDir, env = {}) {
  const dir = path.resolve(soulDir, 'soul');
  const files = await fs.readdir(dir);
  const md = files.find(f => f.endsWith('.md'));
  if (!md) return '';
  const content = await fs.readFile(path.join(dir, md), 'utf8');
  globalThis.soul = { env };
  return $$(content);
}

export async function callLLM(messages, { model = 'gpt-3.5-turbo' } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages })
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = data.error?.message || 'OpenAI API error';
    throw new Error(msg);
  }
  return data.choices[0].message.content.trim();
}

export function createCognitiveStep(builder) {
  return async function (workingMemory, ...args) {
    const cfg = builder(...args);
    let command = cfg.command;
    if (typeof command === 'function') {
      command = command(workingMemory);
    }

    let updated = workingMemory;
    const messages = workingMemory.memories.slice();

    if (command) {
      if (typeof command === 'string') {
        const msg = { role: ChatMessageRoleEnum.System, content: command };
        updated = workingMemory.withMemory(msg);
        messages.push(msg);
      } else {
        updated = workingMemory.withMemory(command);
        messages.push(command);
      }
    }

    const model = cfg.model || 'gpt-3.5-turbo';
    const responseText = await callLLM(messages, { model });

    updated = updated.withMemory({ role: ChatMessageRoleEnum.Assistant, content: responseText });

    let result = responseText;
    if (cfg.schema) {
      try {
        result = JSON.parse(responseText);
      } catch {
        // fallthrough
      }
    }
    if (cfg.postProcess) {
      const [mem, res] = await cfg.postProcess(updated, result);
      return [mem, res];
    }
    return [updated, result];
  };
}

export class Runtime {
  constructor(initialProcess, soulName = 'Soul', env = {}, blueprint = '', storeDir = path.join(os.tmpdir(), 'opensouls-store')) {
    this.soulName = soulName;
    this.env = env;
    this.currentProcess = initialProcess;
    this.nextProcess = null;
    this.previousProcess = undefined;
    this.invocationCount = 0;
    this.invokingPerception = null;
    this.pendingPerceptions = { current: [] };
    this._perceptionQueue = [];
    this._processing = false;
    this.emitter = new EventEmitter();
    this.workingMemory = new WorkingMemory({ soulName });
    if (blueprint) {
      this.workingMemory = this.workingMemory.withMemory({
        role: ChatMessageRoleEnum.System,
        content: blueprint
      });
    }
    this.processStore = new Map();
    this.soulMemory = new Map();
    this.scheduledEvents = new Map();
    this.storeDir = storeDir;
    this.stores = new Map();
  }

  useActions() {
    const runtime = this;
    return {
      speak(content) {
        runtime.emitter.emit('says', { content });
      },
      dispatch(event) {
        runtime.emitter.emit(event.action || 'dispatch', event);
      },
      log(...args) {
        runtime.emitter.emit('log', ...args);
      },
      expire() {
        runtime.emitter.emit('expire');
      },
      scheduleEvent({ in: seconds = 0, when, perception, process }) {
        return runtime.scheduleEvent({ in: seconds, when, perception, process });
      }
    };
  }

  useProcessManager() {
    const runtime = this;
    return {
      previousMentalProcess: runtime.previousProcess,
      invocationCount: runtime.invocationCount,
      pendingScheduledEvents: runtime.getPendingEvents(),
      cancelScheduledEvent(id) {
        runtime.cancelScheduledEvent(id);
      },
      setNextProcess(proc) {
        runtime.nextProcess = proc;
      },
      wait(ms) {
        return new Promise(res => setTimeout(res, ms));
      }
    };
  }

  useProcessMemory(initial) {
    const key = this.currentProcess;
    if (!this.processStore.has(key)) {
      this.processStore.set(key, initial);
    }
    return this.processStore.get(key);
  }

  useSoulMemory(key, initial) {
    if (!this.soulMemory.has(key)) {
      this.soulMemory.set(key, { current: initial });
    }
    return this.soulMemory.get(key);
  }

  async dispatch(perception, processOverride) {
    this._perceptionQueue.push({ perception, processOverride });
    if (this._processing) {
      this.pendingPerceptions.current.push(perception);
      return;
    }
    await this._processQueue();
  }

  async _processQueue() {
    while (this._perceptionQueue.length > 0) {
      const { perception, processOverride } = this._perceptionQueue.shift();
      this._processing = true;
      this.invokingPerception = perception;
      this.pendingPerceptions.current = [];

      this.workingMemory = this.workingMemory.withMemory({
        role: ChatMessageRoleEnum.User,
        content: `${perception.name || 'User'} ${perception.action}: "${perception.content}"`
      });
      const proc = processOverride || this.currentProcess;
      currentRuntime = this;
      globalThis.soul = { env: this.env };
      try {
        const result = await proc({ workingMemory: this.workingMemory });
        this.invocationCount += 1;
        if (this.nextProcess) {
          this.previousProcess = this.currentProcess;
          this.currentProcess = this.nextProcess;
          this.nextProcess = null;
          this.invocationCount = 0;
        }
        this.workingMemory = result instanceof WorkingMemory ? result : this.workingMemory;
      } finally {
        currentRuntime = null;
        delete globalThis.soul;
        this._processing = false;
      }
    }
  }

  on(evt, fn) {
    this.emitter.on(evt, fn);
  }

  scheduleEvent({ in: seconds = 0, when, perception, process }) {
    const id = crypto.randomUUID();
    const whenDate = when ? new Date(when) : new Date(Date.now() + seconds * 1000);
    const delay = Math.max(0, whenDate.getTime() - Date.now());
    const timer = setTimeout(() => {
      this._executeScheduledEvent(id);
    }, delay);
    this.scheduledEvents.set(id, { id, when: whenDate, perception, process, timer });
    return id;
  }

  _executeScheduledEvent(id) {
    const evt = this.scheduledEvents.get(id);
    if (!evt) return;
    this.scheduledEvents.delete(id);
    this.dispatch(evt.perception, evt.process);
  }

  cancelScheduledEvent(id) {
    const evt = this.scheduledEvents.get(id);
    if (evt) {
      clearTimeout(evt.timer);
      this.scheduledEvents.delete(id);
    }
  }

  getPendingEvents() {
    return Array.from(this.scheduledEvents.values())
      .map(({ id, when, perception, process }) => ({ id, when, perception, process }))
      .sort((a, b) => a.when - b.when);
  }

  _getStore(scope, bucket) {
    const key = `${scope}:${bucket}`;
    if (!this.stores.has(key)) {
      const file = path.join(this.storeDir, scope, `${bucket}.json`);
      this.stores.set(key, new LocalStore(file));
    }
    return this.stores.get(key);
  }

  useSoulStore(bucket = 'default') {
    return this._getStore('soul', bucket);
  }

  useBlueprintStore(bucket = 'default') {
    return this._getStore('blueprint', bucket);
  }

  useOrganizationStore(bucket = 'default') {
    return this._getStore('organization', bucket);
  }
}

export function createRuntime(options) {
  return new Runtime(
    options.initialProcess,
    options.soulName,
    options.env || {},
    options.blueprint || '',
    options.storeDir
  );
}

export function useActions() {
  if (!currentRuntime) {
    throw new Error('useActions can only be called inside a mental process');
  }
  return currentRuntime.useActions();
}
export function useProcessManager() {
  if (!currentRuntime) {
    throw new Error('useProcessManager can only be called inside a mental process');
  }
  return currentRuntime.useProcessManager();
}
export function useProcessMemory() {
  if (!currentRuntime) {
    throw new Error('useProcessMemory can only be called inside a mental process');
  }
  return currentRuntime.useProcessMemory(...arguments);
}

export function useSoulMemory() {
  if (!currentRuntime) {
    throw new Error('useSoulMemory can only be called inside a mental process');
  }
  return currentRuntime.useSoulMemory(...arguments);
}

export function useSoulStore() {
  if (!currentRuntime) {
    throw new Error('useSoulStore can only be called inside a mental process');
  }
  return currentRuntime.useSoulStore(...arguments);
}

export function useBlueprintStore() {
  if (!currentRuntime) {
    throw new Error('useBlueprintStore can only be called inside a mental process');
  }
  return currentRuntime.useBlueprintStore(...arguments);
}

export function useOrganizationStore() {
  if (!currentRuntime) {
    throw new Error('useOrganizationStore can only be called inside a mental process');
  }
  return currentRuntime.useOrganizationStore(...arguments);
}

export function usePerceptions() {
  if (!currentRuntime) {
    throw new Error('usePerceptions can only be called inside a mental process');
  }
  return {
    invokingPerception: currentRuntime.invokingPerception,
    pendingPerceptions: currentRuntime.pendingPerceptions
  };
}

globalThis.$$ = $$;

