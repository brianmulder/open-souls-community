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

All code should be covered by automated tests. Run the test suite in the
relevant package before committing:

```bash
cd runtime && npm test
```

You can quickly try a soul manually by running it with the local runtime,
e.g.:

```bash
cd souls/example-twenty-questions
node ../../runtime/cli.js .
```

Ensure `OPENAI_API_KEY` is exported when running a soul manually. Manual runs
are convenient but not required for verifying changes.

## Commit Guidance

- Make descriptive commit messages.
- Keep diffs focused on a single logical change when possible.

## When Updating This File

If collaboration needs change, modify this `AGENTS.md` with clear instructions.
