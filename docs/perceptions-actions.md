## Canonical event schema (v0.1)

```ts
interface Perception {
  type: string          // e.g. "utterance", "vision", "tick"
  payload: unknown      // arbitrary JSON
  ts: number            // epoch-ms
}

interface Action {
  type: string          // e.g. "utterance", "move", "http"
  payload: unknown
  ts: number
}
```

### Core `type` values

| Domain          | Perception                   | Action                       |
| --------------- | ---------------------------- | ---------------------------- |
| Conversational  | `utterance` `{speaker,text}` | `utterance` `{speaker,text}` |
| Time            | `tick` `{secs}`              | —                            |
| Movement (ext.) | `location` `{x,y}`           | `move` `{to}`                |
| Custom plugins  | arbitrary                    | arbitrary                    |

> **Rule:** runtime never interprets *who* the speaker “is”; that’s context stored in `payload`.

---
