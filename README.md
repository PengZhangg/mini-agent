# mini-agent

A basic coding agent written in Typescript. Give it a prompt, and it calls a model through [OpenRouter](https://openrouter.ai), runs the tools the model asks for, feeds the results back, and repeats until the model replies with a final answer.

## Setup

Install dependencies:

```sh
pnpm install
```

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

| Variable              | Required | Default                                  |
| --------------------- | -------- | ---------------------------------------- |
| `OPENROUTER_API_KEY`  | yes      | —                                        |
| `OPENROUTER_MODEL`    | no       | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `OPENROUTER_BASE_URL` | no       | `https://openrouter.ai/api/v1`           |

The model must support tool calling.

## Run

```sh
pnpm dev -p "your prompt"
```

Requires Node 22.18+, which runs TypeScript directly without a build step.

## Tools

| Tool    | What it does                                                                  |
| ------- | ----------------------------------------------------------------------------- |
| `Read`  | Reads a file and returns its contents                                         |
| `Write` | Writes a file, creating parent folders if needed                              |
| `Bash`  | Runs a shell command (30s timeout, output truncated after 20,000 characters) |

> **Warning:** the agent runs shell commands and writes files without asking first. Run it in a directory you don't mind it changing.

## Skills

Add skills in `.agents/skills/<name>/SKILL.md`:

```md
---
name: apple
description: Deploys the apple service to production.
---

Run the deploy script and report the version that was deployed.
```

The name and description of each skill go in the system prompt. The body isn't used yet.

## Project structure

```
app/
  main.ts          # CLI entry point and agent loop
  tools/
    index.ts       # list of available tools
    types.ts       # shared Tool interface
    read.ts
    write.ts
    bash.ts
  skills/
    loadSkills.ts
    parseSkill.ts
    buildSkillsPrompt.ts
    types.ts
```

## Adding a tool

1. Create `app/tools/<name>.ts` exporting a `Tool`: a `definition` (the JSON schema sent to the model) and an async `run(args)` that returns a string.
2. Add it to the array in `app/tools/index.ts`.

## Typecheck

```sh
pnpm typecheck
```
