import fs from 'fs/promises';
import path from 'path';

function tokenize(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function similarity(aTokens, bTokens) {
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export class LocalStore {
  constructor(file) {
    this.file = file;
    this.data = {};
    this.loaded = false;
  }

  async _load() {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = {};
    }
    this.loaded = true;
  }

  async _save() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.data, null, 2));
  }

  createEmbedding(content) {
    return tokenize(String(content));
  }

  async fetch(key, opts = {}) {
    await this._load();
    const entry = this.data[key];
    if (!entry) return undefined;
    if (opts.includeMetadata) {
      return { content: entry.content, metadata: entry.metadata };
    }
    return entry.content;
  }

  async set(key, content, metadata) {
    await this._load();
    this.data[key] = {
      content,
      metadata,
      embedding: this.createEmbedding(content)
    };
    await this._save();
  }

  async remove(key) {
    await this._load();
    delete this.data[key];
    await this._save();
  }

  async search(query, { minSimilarity = 0 } = {}) {
    await this._load();
    const queryEmb = this.createEmbedding(query);
    const results = [];
    for (const [key, entry] of Object.entries(this.data)) {
      const sim = similarity(queryEmb, entry.embedding || []);
      if (sim >= minSimilarity) {
        results.push({ key, content: entry.content, similarity: sim, metadata: entry.metadata });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results;
  }
}
