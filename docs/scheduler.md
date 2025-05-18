### Event queue

* Min-heap keyed by `scheduledTs`.
* `scheduleEvent(fn, delayMs)` → returns `id`.
* `cancelEvent(id)` → clears.
* Supports `pause`, `resume`.

Edge-cases covered in `scheduler.test.ts`: clock skew, long sleep, concurrent inserts.

---
