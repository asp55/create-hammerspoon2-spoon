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
| `-r, --remote <url\|none>` | Git remote to add as `origin` and push the initial commit to. Prompts if omitted; `none` (or empty) keeps the repo local. The remote must be an **empty** repository (no README, license or commits), or the push fails. |
| `--no-install` | TypeScript only: skip `npm install`. |
| `--no-git` | Don't initialize a git repository or make the initial commit. Can't be combined with `--remote`. |
| `-h, --help` | Show help. |

## Templates

- **javascript** creates `./MySpoon.spoon2`. There is no build step: edit `init.js`, then double-click `MySpoon.spoon2` in Finder to install it into Hammerspoon 2.
- **typescript** creates `./MySpoon`, creates its `build/` and `spoons/` folders, and runs `npm install` (skip with `--no-install`). Edit `src/init.ts`, run `npm run typecheck` after each change, then `npm run package` to build `spoons/MySpoon.spoon2` and double-click it to install.

Unless you pass `--no-git`, the new project is also initialized as a git repository with a single initial commit. If you give a remote, it's added as `origin` and the commit is pushed (`git push -u origin HEAD`). The remote repository must be empty: create it on GitHub without a README, license or `.gitignore`, otherwise the push is rejected because its history differs from the new project's. If the remote is a GitHub repository (HTTPS or SSH URL), the generated READMEs also get an "Install from GitHub" section showing `hs.spoons.use("MySpoon", { source: "owner/repo", start: true })`; other remotes get no such section, since `hs.spoons.use` only installs from GitHub or a zip URL. If any git step fails, the project is still created and a warning is printed.

Installing does not load a spoon. Load it from your Hammerspoon 2 config with `hs.spoons.load("MySpoon")`.

## Spoon names

The name (for example `MySpoon`) must start with a letter and contain only letters, digits, `_` and `-`, and it can't be the name of an `hs.spoons` member: `load`, `install`, `available`, `update`, `uninstall`, `installed` or `use`.

## Development

`Templates/` is the published template source. Run the CLI from a checkout with `node bin/create-hammerspoon2-spoon.mjs <SpoonName>`.

Template files use `{{ token }}` placeholders that the CLI fills in: `name`, `identifier` (PascalCase, for code), `packageName`, `author` and `description`. An unknown placeholder is an error. Inside `.json` files values are JSON-escaped.

Each template stores its ignore file as `_gitignore` (npm drops `.gitignore` files when publishing); the CLI renames it to `.gitignore` in the generated project.
