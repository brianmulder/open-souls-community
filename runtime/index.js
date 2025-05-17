import EventEmitter from 'events';

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
  constructor(initialProcess, soulName = 'Soul') {
    this.soulName = soulName;
    this.currentProcess = initialProcess;
    this.nextProcess = null;
    this.invocationCount = 0;
    this.emitter = new EventEmitter();
    this.workingMemory = new WorkingMemory({ soulName });
    this.processStore = new Map();
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
      scheduleEvent({ in: seconds = 0, perception, process }) {
        setTimeout(() => {
          runtime.dispatch(perception, process);
        }, seconds * 1000);
      }
    };
  }

  useProcessManager() {
    const runtime = this;
    return {
      invocationCount: runtime.invocationCount,
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

  async dispatch(perception, processOverride) {
    this.workingMemory = this.workingMemory.withMemory({
      role: ChatMessageRoleEnum.User,
      content: `${perception.name || 'User'} ${perception.action}: "${perception.content}"`
    });
    const proc = processOverride || this.currentProcess;
    const result = await proc({ workingMemory: this.workingMemory });
    this.invocationCount += 1;
    if (this.nextProcess) {
      this.currentProcess = this.nextProcess;
      this.nextProcess = null;
      this.invocationCount = 0;
    }
    this.workingMemory = result instanceof WorkingMemory ? result : this.workingMemory;
  }

  on(evt, fn) {
    this.emitter.on(evt, fn);
  }
}

export function createRuntime(options) {
  return new Runtime(options.initialProcess, options.soulName);
}

export function useActions() {
  throw new Error('useActions can only be called inside a mental process');
}
export function useProcessManager() {
  throw new Error('useProcessManager can only be called inside a mental process');
}
export function useProcessMemory() {
  throw new Error('useProcessMemory can only be called inside a mental process');
}

