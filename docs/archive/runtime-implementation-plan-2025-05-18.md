# Runtime Implementation Plan

This document outlines the steps required to add missing functionality to the local runtime. The milestones are based on the gaps identified in the documentation and example souls under `souls/`.

## Milestone 1 – Environment Variable Templating *(Completed)*

* Create a configuration loader that reads `/soul/default.env.ts` for each soul.
* Expose the parsed values via `soul.env`.
* Implement the `$$(text)` helper to perform `{{variable}}` interpolation using `soul.env`.
* Apply template expansion when loading blueprint markdown files (e.g. `{{entityName}}.md`).

## Milestone 2 – Event Scheduling and Management *(Completed)*

* Replace the simple `setTimeout` logic with a queue of pending events.
* Generate a unique ID for each scheduled event and return it from `scheduleEvent`.
* Provide `cancelScheduledEvent(id)` and expose `pendingScheduledEvents` via `useProcessManager`.
* Ensure scheduled events survive process transitions and can be cancelled before execution.

## Milestone 3 – Process Manager Enhancements *(Completed)*

* Track the previously executed mental process and expose it as `previousMentalProcess`.
* Maintain `invocationCount` per process and reset when switching processes.
* Surface `pendingScheduledEvents` and `cancelScheduledEvent` through `useProcessManager`.
* Update `wait()` to be a promise-based sleep helper used by processes.

## Milestone 4 – Perception Utilities *(Completed)*

* Record the perception that triggered the current process as `invokingPerception`.
* Keep a list of new perceptions that arrive while a process is running (`pendingPerceptions`).
* Implement a `usePerceptions` hook so processes can access this information.

## Milestone 5 – Persistence APIs *(Completed)*

* Implement `useSoulStore` as a persistent key–value store with optional vector search.
* Provide `useSoulMemory`, `useBlueprintStore` and `useOrganizationStore` for scoped persistence.
* Start with a simple JSON or filesystem backend before exploring database options.

## Milestone 6 – Subprocess Support *(Completed)*

* Detect an optional `subprocesses/` directory or file alongside the main blueprint.
* After each main mental process, execute any subprocesses asynchronously.
* Abort subprocess execution if a new perception arrives that changes the main process.

## Milestone 7 – Streaming and Stream Processing *(Completed)*

* Extend `callLLM` and `createCognitiveStep` to accept a `stream` option.
* Emit partial responses to `speak()` as tokens arrive.
* Support a `streamProcessor` callback to transform or filter streamed text.

---

Implementing these milestones will align the runtime with the documented APIs and allow the example souls to run without modification.
