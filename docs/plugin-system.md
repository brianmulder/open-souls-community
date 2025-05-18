### Writing a plugin

```ts
export const id = 'clock'

export function init({ publishPerception }) {
  setInterval(() => {
    publishPerception({ type: 'tick', payload: { secs: 60 }, ts: Date.now() })
  }, 60000)
}
```

* Drop file in `/plugins`; supervisor auto-loads.
* Plugins can also **consume actions** by exporting `onAction(action)`.

---
