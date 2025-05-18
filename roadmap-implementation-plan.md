*revision 0.1 · 18 May 2025*


The target runtime is *Open-Souls Community* — a local-first daemon engine that drives AI “souls” through a pure stream of **Perception → MentalProcess → Action** events.

---

## Orientation  
Node 18 (Typescript) for supervisor, UI, and plugins.  
Python micro-helpers are allowed but must be wrapped by the Node supervisor.  
Every feature must ship with:  
* Conventional-commit message (`feat:`, `fix:`, `docs:` …)  
* ESLint + Prettier passing (`npm run lint`)  
* Jest unit tests  
* A doc update (or new doc) under `/docs`

---

## Milestone 0 · Docs Bootstrap ✅
Create the fresh documentation scaffold (see <scaffold> below) already agreed on (`README.md`, `VISION.md`, `ROADMAP.md`, `docs/*`).   
Move the obsolete `runtime-implementation-plan.md` into `docs/archive/` with a “historical reference only” banner.  
**Acceptance:** `npm test` green, repo root shows new files, README links to docs.

---

## Milestone 1 · Perception Core  
* Add canonical **`Perception`** and **`Action`** interfaces (`type string`, `payload any`, `ts number`).  
* Replace `runtime.dispatch()` with `runtime.ingestPerception()`.  
* Replace `says()` helper with `runtime.act()`.  
* Update one demo soul so it compiles with the new API.  
**Acceptance:** unit tests for ingest/act round-trip; sample soul prints its greeting via the new path.

---

## Milestone 2 · Scheduler & Tick  
* Implement a priority-queue scheduler with `scheduleEvent()`, `cancelEvent()`, `wait(ms)`.  
* Supervisor emits `Perception{type:"tick", payload:{secs:1}}` every real-time second.  
**Acceptance:** Jest covers queue ordering and cancel; CLI log shows tick events in real time.

---

## Milestone 3 · Memory Layer  
* Filesystem KV store (`useSoulStore`) under `.store/`.  
* Episodic log with optional embeddings (`useSoulMemory`).  
* Vector search via FAISS / Chroma (local).  
* Prompt builder now injects top-k recalled memories.  
**Acceptance:** tests for KV get/set, log append, search returns expected line for query “hello”.

---

## Milestone 4 · Supervisor Multiprocess  
* Node master process spawns each soul as its own OS child.  
* JSON-RPC over a Unix socket (`~/opensouls.sock`); Windows falls back to named pipes.  
* Auto-restart crashed souls with exponential back-off; heartbeat ping every 5 s.  
**Acceptance:** run two demo souls; killing one PID auto-respawns it in < 5 s.

---

## Milestone 5 · Baseline Effectuators  
* Plugin registry: `registerSink({id, handles, execute})`.  
* **TerminalEffectuator** — consumes `Action{type:"utterance"}` and `console.log`s the text.  
* **UISink** — pushes same action to a WebSocket topic for browser display.  
* Provide a `plugins/clock` perception injector emitting the same tick used in Milestone 2.  
**Acceptance:** typing “hi” makes the soul print a reply in the terminal **and** broadcast JSON over WS.

---

## Milestone 6 · Perception-Feed UI  
* Next.js + Tailwind timeline that shows perceptions and actions interleaved (icon per `type`).  
* Text input sends `Perception{type:"utterance", speaker:"human"}` via WS.  
* Memory-drawer dev panel shows last 10 memories and current mood.  
**Acceptance:** open `localhost:3000`, type “hello”, see soul’s reply plus tick events scrolling silently.

---

## Milestone 7 · Plugin SDK  
* Auto-loader: any `.ts` file in `/plugins` is required at boot.  
* Hooks: `publishPerception`, `onAction`.  
* Sample `filewatch` injector: touching `watched.txt` emits a perception.  
* Flesh out `docs/plugin-system.md`.  
**Acceptance:** touch file → perception appears in UI.

---

## Milestone 8 · MCP Adapter  
* Effectuator plugin that maps selected `Action` types to Anthropic **MCP** tool calls over secure WebSocket.  
* Env vars: `MCP_WS_URL`, `MCP_API_TOKEN`.  
* On MCP response, convert to `Perception{type:"tool.result"}` and feed to soul.  
**Acceptance:** mock MCP server returns “OK”; perception shows in UI with that payload.

---

## Milestone 9 · Reflection & Dreams  
* Background MentalProcess template: every 86 400 tick seconds summarises new memories into belief statements.  
* Beliefs stored in KV (`store.set("beliefs", arr)`) and surfaced in subsequent prompts.  
**Acceptance:** fast-forward ticks, belief list grows by ≥1 item.

---

## Milestone 10 · Desktop Packaging  
* Electron wrapper bundling supervisor, UI, runtime, Node.  
* One-click installer (.dmg / .exe) with auto-update disabled.  
**Acceptance:** built binary launches, spawns default soul offline, UI works.

---

