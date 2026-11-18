# create-hammerspoon2-spoon

Scaffold a new [Hammerspoon 2](https://github.com/cmsj/Hammerspoon2) spoon.

```sh
npx create-hammerspoon2-spoon my-spoon            # prompts for a template
npx create-hammerspoon2-spoon my-spoon -t ts      # TypeScript
npx create-hammerspoon2-spoon my-spoon -t js -a "Jane <jane@example.com>" -d "Does things"
```

- **javascript**: creates `./my-spoon.spoon2`, ready to drop into `~/.config/Hammerspoon2/Spoons/`.
- **typescript**: creates `./my-spoon`; run `npm install && npm run package` to produce `spoons/my-spoon.spoon2`.

The spoon name must start with a letter and contain only letters, digits, `_` and `-`.
The author defaults to your `git config` user.

## Development

`Templates/` is the published template source. Run the CLI from a checkout with `node bin/create-hammerspoon2-spoon.mjs <name>`.
Each template stores its ignore file as `_gitignore` (npm drops `.gitignore` files when publishing); the CLI renames it to `.gitignore` in the generated project.
