# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Background

{{ name }} is a [Hammerspoon 2](https://github.com/cmsj/Hammerspoon2) spoon written in TypeScript. Hammerspoon 2 is a macOS app that embeds JavaScriptCore and exposes macOS APIs to user JavaScript. The code here is compiled with `tsc` to CommonJS and packaged as a `.spoon2` directory.

**Purpose:** {{ description }}

The runtime is JavaScriptCore plus Hammerspoon, **not Node**. Do not use Node APIs or add `@types/node` in `src/`. Only the `npm_scripts/*.mjs` build scripts run under Node.

## Commands

- `npm run typecheck`: type-check without emitting (`tsc --noEmit`). Run this after every code change.
- `npm run build`: clean `build/`, compile `src/` with `tsc`, then copy non-TypeScript assets (e.g. `spoon.json`) into `build/`.
- `npm run package`: build, then create `package/<name>.spoon2` from `build/`. `<name>` comes from `spoon.json`.
- `npm run clean`: remove `build/` and `package/`.

`build/` and `package/` are generated and git-ignored. Never edit them by hand.

## Layout

- `src/init.ts`: the spoon entry point. It exports the spoon object with `init`, `start`, `stop` and a `logLevel` property, using `export =` (CommonJS).
- `src/modules/`: supporting modules (currently `Logger.ts`).
- `src/spoon.json`: spoon metadata (`name`, `author`, `version`, `description`). `hs.spoons.load()` copies `author`, `description` and `version` onto the exported object.
- `types/hammerspoon.d.ts`: Hammerspoon 2 API typings. It is auto-generated ("DO NOT EDIT"); regenerate it from the Hammerspoon 2 repo, don't hand-edit.
- `types/commonjs.d.ts`: CommonJS globals for the JavaScriptCore runtime.
- `npm_scripts/`: build and packaging scripts.

## Conventions

- **Module format:** CommonJS, because Hammerspoon 2 loads spoons with `require()`. Keep `"module": "commonjs"` in `tsconfig.json`.
- **Strict TypeScript:** `strict`, `noUnusedLocals`, `noUnusedParameters` and `noImplicitReturns` are on. Fix errors rather than suppressing them.
- **Logging:** use `createLogger()` from `src/modules/Logger.ts`, not bare `console.*`, so the spoon's `logLevel` applies. Levels, least to most verbose: `error`, `warn`, `info`, `log`, `debug`.
- **Lifecycle:** `init()` is called by `hs.spoons.load()` and may run more than once, so keep it free of side effects that must only happen once. Put start-up behavior in `start()` and teardown in `stop()`. `start()` and `stop()` return the spoon so calls can be chained.
- **Spoon name:** the `name` in `spoon.json` becomes a directory name in `package.mjs`, which only accepts `[A-Za-z0-9_-]+`. Keep it that way.
- **Imports:** do not add runtime dependencies. The spoon is shipped as plain compiled files with no `node_modules`. `typescript` is the only dev dependency.

## Project policies

- AI usage: see [AI_POLICY.md](AI_POLICY.md).
- Conduct: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- Commits: conventional commits, English, imperative, one change each. Do not commit or push unless asked.
- Co-authorship: if you (Claude) contributed to the files being committed, add a `Co-Authored-By:` line to the commit message, e.g. `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
