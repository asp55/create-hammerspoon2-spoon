# create-hammerspoon2-spoon

Scaffold a new [Hammerspoon 2](https://github.com/cmsj/Hammerspoon2) spoon.

```sh
npx create-hammerspoon2-spoon MySpoon            # prompts for a template and description
npx create-hammerspoon2-spoon MySpoon -t ts      # TypeScript
npx create-hammerspoon2-spoon MySpoon -t js -a "Jane <jane@example.com>" -d "Does things"
```

## Options

| Option | Description |
| --- | --- |
| `-t, --template <javascript\|typescript>` | Template to use (`js` and `ts` also work). Prompts if omitted. |
| `-a, --author <"Name <email>">` | Author written to `spoon.json`. Defaults to your `git config` user. |
| `-d, --description <text>` | Description written to `spoon.json`. Prompts if omitted. |
| `--no-install` | TypeScript only: skip `npm install`. |
| `-h, --help` | Show help. |

## Templates

- **javascript** creates `./MySpoon.spoon2`. There is no build step: edit `init.js`, then double-click `MySpoon.spoon2` in Finder to install it into Hammerspoon 2.
- **typescript** creates `./MySpoon`, creates its `build/` and `spoons/` folders, and runs `npm install` (skip with `--no-install`). Edit `src/init.ts`, run `npm run typecheck` after each change, then `npm run package` to build `spoons/MySpoon.spoon2` and double-click it to install.

Installing does not load a spoon. Load it from your Hammerspoon 2 config with `hs.spoons.load("MySpoon")`.

## Spoon names

Use PascalCase, for example `MySpoon`. The name must start with a letter and contain only letters, digits, `_` and `-`, and it can't be the name of an `hs.spoons` member: `load`, `install`, `available`, `update`, `uninstall`, `installed` or `use`.

## Development

`Templates/` is the published template source. Run the CLI from a checkout with `node bin/create-hammerspoon2-spoon.mjs <SpoonName>`.

Template files use `{{ token }}` placeholders that the CLI fills in: `name`, `identifier` (PascalCase, for code), `packageName`, `author` and `description`. An unknown placeholder is an error. Inside `.json` files values are JSON-escaped.

Each template stores its ignore file as `_gitignore` (npm drops `.gitignore` files when publishing); the CLI renames it to `.gitignore` in the generated project.
