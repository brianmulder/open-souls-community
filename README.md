# 🤖+👱 OPEN SOULS (Community)

[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/OpenSoulsPBC.svg?style=social&label=Follow%20%40OpenSoulsPBC)](https://twitter.com/OpenSoulsPBC) [![](https://dcbadge.vercel.app/api/server/FCPcCUbw3p?compact=true&style=flat)](https://discord.gg/opensouls)

## 🤔 What is this?

This repository is a place for sharing knowledge on how to create AI souls. This repository holds docs, snippets, and examples for building AI souls with `@opensouls/core` and our **local runtime**. The runtime is published as `@opensouls/local-engine`.


Any soul in the repo can be run locally using the new runtime. The runtime uses
the OpenAI API, so set `OPENAI_API_KEY` in your environment before running a
soul.

```bash
cd souls/example-twenty-questions
node ../../runtime/cli.js .
```
The CLI automatically transpiles TypeScript sources, so no prebuild step is needed.

## 💫 AI Souls

AI Souls are agentic and embodied digital beings, one day comprising thousands of mental processes managed by the runtime. Unlike traditional chatbots, this code will give digital souls personality, drive, ego, and will.

## 🔑 Getting Started
1. Clone the repository and install dependencies for any soul you wish to run.
1. Export your OpenAI API key: `export OPENAI_API_KEY=your-key`.
1. Run the soul with `node ../../runtime/cli.js .`
   (the CLI automatically transpiles TypeScript sources)

Make sure to checkout the [documentation](https://docs.souls.chat)!

## 🙋 Contributing

Check out [CONTRIBUTING](./CONTRIBUTING.md) and open up a PR!

We're excited for contributions, such as:
  - Reporting bugs
  - Suggesting enhancements
  - Submitting new example souls
  - Contributing cognitive steps and other code to the library
  - Improving documentation
  - Providing feedback

## 📜 License

The documentation (`/docs`) is included under CC-BY-4.0 license.

Unless otherise noted, the remainder of the repository - i.e. the `/library`, `/demos`, and `/souls` are included under MIT license.
