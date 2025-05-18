## Big-picture

```mermaid
graph TD
    A[Perception sources] -->|emit| R(Runtime Daemon)
    R -->|invoke| MP[MentalProcess]
    MP -->|produce| AC(Action)
    AC -->|route| SUP(Supervisor)
    SUP -->|display| UI(Perception Feed UI)
    SUP -->|deliver| EXT(Environment / Plugins)
```

* **Runtime Daemon** – single-agent event loop (one OS process per soul).
* **Supervisor** – spawns daemons, routes events, restarts on crash.
* **UI** – simple timeline; input box just emits `Perception{type:"utterance"}`.
* **Plugins** – bidirectional adapters (clock, game engine, etc.).

---
