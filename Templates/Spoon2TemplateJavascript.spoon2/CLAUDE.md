# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Background

{{ name }} is a [Hammerspoon 2](https://github.com/cmsj/Hammerspoon2) spoon written in plain JavaScript. Hammerspoon 2 is a macOS app that embeds JavaScriptCore and exposes macOS APIs to user JavaScript.

**Purpose:** {{ description }}

There is no build step, no `package.json`, no TypeScript and no `node_modules`. The files in this repository are the spoon: what you edit is what Hammerspoon 2 loads.

The runtime is JavaScriptCore plus Hammerspoon, **not Node**. Do not use Node APIs (`fs`, `path`, `process`, `Buffer`, etc.). Use the `hs.*` APIs that Hammerspoon 2 provides, and standard JavaScript supported by JavaScriptCore.

## Commands

There are no build, lint or test commands. To check a change, load the spoon in Hammerspoon 2 and watch its console output (set `logLevel` to `"debug"` for more detail).

## Layout

- `init.js`: the spoon entry point. It builds the spoon object with `init`, `start`, `stop` and a `logLevel` property, and exports it with `module.exports`.
- `modules/`: supporting modules (currently `Logger.js`).
- `spoon.json`: spoon metadata (`name`, `author`, `version`, `description`). `hs.spoons.load()` copies `author`, `description` and `version` onto the exported object.
- `AI_POLICY.md`, `CODE_OF_CONDUCT.md`, `README.md`: project documents.

## Conventions

- **Module format:** CommonJS. Hammerspoon 2 loads spoons with `require()`, so use `require()` and `module.exports`, not ES `import`/`export`. Include the `.js` extension in relative requires, as `init.js` does.
- **Logging:** use `createLogger()` from `modules/Logger.js`, not bare `console.*`, so the spoon's `logLevel` applies. Levels, least to most verbose: `error`, `warn`, `info`, `log`, `debug`.
- **Lifecycle:** `init()` is called by `hs.spoons.load()` and may run more than once, so keep it free of side effects that must only happen once. Put start-up behavior in `start()` and teardown in `stop()`. `start()` and `stop()` return the spoon so calls can be chained.
- **Spoon name:** keep the `name` in `spoon.json` limited to letters, digits, `_` and `-`, because it is used as a directory name.
- **Dependencies:** do not add runtime or dev dependencies, and do not introduce a build toolchain or `package.json`. The spoon ships as plain files.
- **Style:** match the existing code (4-space indentation, double-quoted strings, semicolons). Prefer editing existing files over adding new ones, and do not add features or refactors that were not requested.

## Project policies

- AI usage: see [AI_POLICY.md](AI_POLICY.md).
- Conduct: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- Commits: conventional commits, English, imperative, one change each. Do not commit or push unless asked.
- Co-authorship: if you (Claude) contributed to the files being committed, add a `Co-Authored-By:` line to the commit message, e.g. `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
