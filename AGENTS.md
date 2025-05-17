# AGENT COLLABORATION GUIDELINES

This file describes how ChatGPT and repository contributors should work together when improving the local runtime for Souls.

## Repository Layout

- `runtime/` – source for the local soul engine runtime. Run a soul with `node cli.js <path-to-soul>`.
- `souls/` – example souls that can be executed with the runtime.
- `library/` – shared cognitive functions and utilities.
- `docs/` – documentation site for the project.

## Development Conventions

- **Node Version**: use Node.js 18 or newer.
- **Module Style**: use ES modules (`import` / `export`) rather than CommonJS.
- **Indentation**: two spaces; avoid trailing whitespace.
- **File Naming**: prefer kebab-case for filenames and camelCase for variables.
- **Dependencies**: run `npm install` in the affected package when adding dependencies and commit the updated `package-lock.json`.

## Testing Changes

Automated tests are required:

1. From `runtime/`, run `npm test`. This invokes `node --test` and runs all
   automated checks.
2. Tests should stub any HTTP calls to OpenAI (override `fetch`).

Manual testing is optional but easy. From a soul directory:
```bash
node ../../runtime/cli.js .
```
Ensure the soul responds as expected.

## Commit Guidance

- Make descriptive commit messages.
- Keep diffs focused on a single logical change when possible.

## When Updating This File

If collaboration needs change, modify this `AGENTS.md` with clear instructions.

## Runtime Learnings

- The runtime exposes a `currentRuntime` reference so hooks like `useActions`
  work during mental processes.
- Example souls may use TypeScript and be compiled when tested.
- Automated tests verify the runtime can host a minimal "Golem" soul while
  stubbing OpenAI requests.
