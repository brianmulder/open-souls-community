* Node master that:

  * reads `souls.config.json`
  * spawns each soul via `child_process.fork`
  * routes JSON-RPC messages (`perception`, `action`, `heartbeat`)
  * restarts crashed souls (exponential back-off)

IPC default = Unix socket `~/opensouls.sock`; Windows uses named pipe.

---
