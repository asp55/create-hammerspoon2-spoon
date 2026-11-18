# {{ name }}

{{ description }}

A [Hammerspoon 2](https://github.com/cmsj/Hammerspoon2) spoon written in TypeScript. This file is for developing the spoon. The README that ships inside the installed spoon is [src/README.md](src/README.md).

## Getting started

```sh
npm install          # skipped if you used --no-install
npm run typecheck    # type-check after every change
npm run package      # build spoons/{{ name }}.spoon2
```

Double-click `spoons/{{ name }}.spoon2` to install it into Hammerspoon 2, then load it from your Hammerspoon 2 config:

```js
hs.spoons.load("{{ name }}");
```

Installing does not load a spoon, and loading does not start it. Call `hs.spoons["{{ name }}"].start()` to run it.

{{ repoInstall }}## Scripts

| Script | Description |
| --- | --- |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`). |
| `npm run build` | Clean `build/`, compile `src/` with `tsc`, then copy non-TypeScript files (such as `spoon.json`) into `build/`. |
| `npm run package` | Build, then create `spoons/{{ name }}.spoon2` from `build/`. |
| `npm run clean` | Remove the contents of `build/` and `spoons/`. |

`build/` and `spoons/` are generated: don't edit them by hand.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/init.ts` | Spoon entry point. Exports the spoon object with `init`, `start`, `stop` and `logLevel`. |
| `src/modules/` | Supporting modules, such as `Logger.ts`. |
| `src/spoon.json` | Spoon metadata (`name`, `author`, `version`, `description`). |
| `src/README.md` | End-user README, copied into the packaged spoon. |
| `types/` | Typings for the Hammerspoon 2 API (`hammerspoon.d.ts`, auto-generated, don't hand-edit) and CommonJS globals. |
| `npm_scripts/` | Build and packaging scripts (run under Node). |

## Things to know

- The spoon runs in JavaScriptCore inside Hammerspoon, **not Node**. Don't use Node APIs in `src/`. Only `npm_scripts/` runs under Node.
- The output is CommonJS, because Hammerspoon 2 loads spoons with `require()`.
- The spoon ships as plain compiled files with no `node_modules`, so don't add runtime dependencies.
- `init()` can run more than once. Put start-up behavior in `start()` and teardown in `stop()`.
- Use `createLogger()` from `src/modules/Logger.ts` instead of `console.*`, so the spoon's `logLevel` applies.
- The `name` in `src/spoon.json` becomes a directory name, so it may only contain letters, digits, `_` and `-`.

## Contributing

See [AI_POLICY.md](AI_POLICY.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). [CLAUDE.md](CLAUDE.md) has guidance for AI coding assistants.
