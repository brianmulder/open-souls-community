### Layers

1. **Working memory** – last N perceptions kept in RAM.
2. **Episodic log** – append-only JSONL, each line `{ts, text, vec}`.
3. **Vector index** – FAISS / Chroma sidecar per soul (`.store/vec/`).
4. **Reflections** – scheduled summary process promotes insights to `beliefs[]`.

**Embedding pipeline**: OpenAI API (default) or local `all-MiniLM`. Config via env `EMBED_BACKEND`.

---
