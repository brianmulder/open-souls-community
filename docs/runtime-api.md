### Public helpers exposed to MentalProcess code

```ts
runtime.perceive(p: Perception): void              // ingest new perception
runtime.act(a: Action): void                       // enqueue outbound action
runtime.wait(ms: number): Promise<void>            // scheduler sleep
runtime.store.get(key): any                        // KV persistence
runtime.store.set(key, val): void
runtime.memory.append(text, importance?): void     // episodic log
runtime.memory.search(query, k?): MemoryItem[]     // vector recall
```

All helpers are Promise-friendly and test-covered (see `runtime/test/`).

---
