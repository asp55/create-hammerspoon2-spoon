#!/usr/bin/env node
// create-hammerspoon2-spoon: scaffold a Hammerspoon 2 spoon from a template.
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const templatesRoot = join(pkgRoot, "Templates");

const TEMPLATES = {
    javascript: { dir: "Spoon2TemplateJavascript.spoon2", outputSuffix: ".spoon2", label: "JavaScript (no build step)" },
    typescript: { dir: "Spoon2TemplateTypescript", outputSuffix: "", label: "TypeScript (tsc build + packaging)" },
};
const ALIASES = { js: "javascript", ts: "typescript" };
const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
// Names of hs.spoons' own members: Hammerspoon 2 refuses to load a spoon with one of these names.
const RESERVED_NAMES = new Set(["load", "install", "available", "update", "uninstall", "installed", "use"]);
const TEXT_FILE = /\.(js|mjs|ts|json|md|txt)$|(^|\/)(_gitignore|\.gitignore)$/;

const USAGE = `Usage: create-hammerspoon2-spoon <SpoonName> [options]

Options:
  -t, --template <javascript|typescript>  Template to use (js / ts accepted). Prompts if omitted.
  -a, --author <"Name <email>">           Author for spoon.json (default: from git config)
  -d, --description <text>                Description for spoon.json. Prompts if omitted.
  -r, --remote <url|none>                 Git remote to add as "origin" and push to. Prompts if omitted;
                                          "none" (or empty) keeps the repo local. The remote must be an
                                          EMPTY repository (no README, license or commits), or the push fails.
      --no-install                        TypeScript only: don't run npm install
      --no-git                            Don't initialize a git repository or commit
  -h, --help                              Show this help

<SpoonName> (e.g. MySpoon) must start with a letter, contain only letters, digits, "_" and "-",
and not be the name of an hs.spoons member (load, install, available, update, uninstall, installed, use).`;

function fail(message) {
    console.error(`error: ${message}`);
    process.exit(1);
}

function toIdentifier(name) {
    return name.split(/[-_]+/).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join("");
}

function gitAuthor() {
    const get = (key) => {
        try {
            return execFileSync("git", ["config", "--get", key], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
        } catch {
            return "";
        }
    };
    const name = get("user.name");
    const email = get("user.email");
    if (!name) return "";
    return email ? `${name} <${email}>` : name;
}

async function walk(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...(await walk(p)));
        else files.push(p);
    }
    return files;
}

// Replaces {{ token }} placeholders. Unknown tokens throw so a typo in a template can't ship.
// Inside .json files values are JSON-escaped (without the surrounding quotes) so the file stays valid.
function render(content, file, tokens) {
    const isJson = file.endsWith(".json");
    return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
        if (!Object.hasOwn(tokens, key)) throw new Error(`unknown placeholder {{ ${key} }} in ${file}`);
        return isJson ? JSON.stringify(tokens[key]).slice(1, -1) : tokens[key];
    });
}

async function chooseTemplate(given) {
    if (given) {
        const key = ALIASES[given.toLowerCase()] ?? given.toLowerCase();
        if (!TEMPLATES[key]) fail(`unknown template "${given}" (use javascript or typescript)`);
        return key;
    }
    if (!process.stdin.isTTY) return "javascript";
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const keys = Object.keys(TEMPLATES);
        keys.forEach((k, i) => console.log(`  ${i + 1}) ${TEMPLATES[k].label}`));
        const answer = (await rl.question("Template [1]: ")).trim();
        const index = answer === "" ? 0 : Number(answer) - 1;
        if (!Number.isInteger(index) || !keys[index]) fail(`invalid choice "${answer}"`);
        return keys[index];
    } finally {
        rl.close();
    }
}

// Uses the -d value when given; otherwise asks (Enter accepts the default) when interactive.
async function chooseDescription(given, name) {
    const fallback = `The ${name} spoon`;
    if (given) return given;
    if (!process.stdin.isTTY) return fallback;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = (await rl.question(`Description [${fallback}]: `)).trim();
        return answer === "" ? fallback : answer;
    } finally {
        rl.close();
    }
}

// Returns the remote URL, or "" for none. Uses the -r value when given; otherwise asks when interactive.
async function chooseRemote(given) {
    const normalize = (v) => (/^(none|no|-)?$/i.test(v.trim()) ? "" : v.trim());
    if (given !== undefined) return normalize(given);
    if (!process.stdin.isTTY) return "";
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        return normalize(await rl.question("Git remote URL - must be an empty repository (Enter for none/local only): "));
    } finally {
        rl.close();
    }
}

// "owner/repo" for a GitHub remote (https or ssh form), else "". hs.spoons.use() can only install from GitHub or a zip URL.
function githubSlug(remote) {
    const m = /^(?:https:\/\/(?:www\.)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(remote);
    return m ? m[1] : "";
}

// Markdown for the templates' READMEs ({{ repoInstall }}); empty unless there's a GitHub remote.
function repoInstallSection(slug, name, templateKey) {
    if (!slug) return "";
    const note =
        templateKey === "typescript"
            ? `Hammerspoon 2 installs the built \`spoons/${name}.spoon2\` folder from the repository, so run \`npm run package\` and commit the result whenever you change the spoon.`
            : `The repository root is the spoon, so there is nothing to build.`;
    return [
        "## Install from GitHub",
        "",
        "Instead of installing by hand, let Hammerspoon 2 download, load and start the spoon from this repository. Put this in your Hammerspoon 2 config:",
        "",
        "```js",
        `hs.spoons.use("${name}", { source: "${slug}", start: true });`,
        "```",
        "",
        `It installs the spoon the first time it runs and just loads it afterwards. Add \`ref: "v1.0.0"\` (a tag or commit) to pin a version. ${note}`,
        "",
        "",
    ].join("\n");
}

function git(args, cwd) {
    execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

// Initializes a repo, commits the scaffold and pushes when a remote is given. Never throws:
// the project already exists, so a git problem is reported as a warning with the manual fix.
function initRepo(target, remote) {
    const result = { committed: false, pushed: false };
    const step = (label, args) => {
        try {
            git(args, target);
            return true;
        } catch (e) {
            const detail = String(e.stderr || e.message).trim().split("\n")[0];
            console.error(`warning: ${label} failed (${detail}).`);
            return false;
        }
    };
    if (!step("git init", ["init"])) return result;
    if (!step("git add", ["add", "-A"])) return result;
    if (!step("git commit", ["commit", "-m", "chore: scaffold spoon from create-hammerspoon2-spoon"])) return result;
    result.committed = true;
    if (remote) {
        if (!step("git remote add", ["remote", "add", "origin", remote])) return result;
        result.pushed = step("git push", ["push", "-u", "origin", "HEAD"]);
    }
    return result;
}

async function main() {
    let parsed;
    try {
        parsed = parseArgs({
            allowPositionals: true,
            options: {
                template: { type: "string", short: "t" },
                author: { type: "string", short: "a" },
                description: { type: "string", short: "d" },
                remote: { type: "string", short: "r" },
                "no-install": { type: "boolean" },
                "no-git": { type: "boolean" },
                help: { type: "boolean", short: "h" },
            },
        });
    } catch (e) {
        fail(`${e.message}\n\n${USAGE}`);
    }
    const { values, positionals } = parsed;
    if (values.help) return console.log(USAGE);
    if (positionals.length !== 1) fail(`expected exactly one <SpoonName>\n\n${USAGE}`);

    const name = positionals[0];
    if (!NAME_PATTERN.test(name)) fail(`invalid spoon name "${name}": use letters, digits, "_" and "-", starting with a letter (e.g. MySpoon)`);
    if (RESERVED_NAMES.has(name)) fail(`"${name}" is reserved: it is the name of an hs.spoons member (reserved: ${[...RESERVED_NAMES].join(", ")})`);

    if (values["no-git"] && values.remote && !/^(none|no|-)$/i.test(values.remote.trim())) {
        fail("--remote can't be used with --no-git");
    }

    const templateKey = await chooseTemplate(values.template);
    const template = TEMPLATES[templateKey];
    const description = (await chooseDescription(values.description, name)).replace(/\s+/g, " ").trim();
    const remote = values["no-git"] ? "" : await chooseRemote(values.remote);
    if (remote.startsWith("-")) fail(`invalid remote "${remote}"`);
    const tokens = {
        name,
        identifier: toIdentifier(name),
        // The TypeScript template's package.json is the build project, not the spoon. npm names must be lowercase.
        packageName: `${name.toLowerCase()}-builder`,
        author: values.author ?? (gitAuthor() || "Your Name <you@example.com>"),
        description,
        repoInstall: repoInstallSection(githubSlug(remote), name, templateKey),
    };
    const source = join(templatesRoot, template.dir);
    if (!existsSync(source)) fail(`template files not found at ${source}`);

    const target = resolve(process.cwd(), `${name}${template.outputSuffix}`);
    if (existsSync(target) && (await readdir(target)).length > 0) fail(`${target} already exists and is not empty`);

    await mkdir(target, { recursive: true });
    await cp(source, target, {
        recursive: true,
        filter: (src) => !src.endsWith(".DS_Store") && !src.includes("node_modules"),
    });

    for (const file of await walk(target)) {
        let path = file;
        // Templates store .gitignore as _gitignore because npm drops files with that name when publishing.
        if (file.endsWith("/_gitignore")) {
            path = join(dirname(file), ".gitignore");
            await rename(file, path);
        }
        const rel = path.slice(target.length + 1);
        if (!TEXT_FILE.test(rel) || rel.endsWith("hammerspoon.d.ts")) continue;
        const original = await readFile(path, "utf8");
        const updated = render(original, rel, tokens);
        if (updated !== original) await writeFile(path, updated);
    }

    const rel = `${name}${template.outputSuffix}`;
    let installed = false;
    let packaged = false;
    if (templateKey === "typescript") {
        // npm doesn't ship empty directories, so create the ones the build scripts expect.
        await mkdir(join(target, "build"), { recursive: true });
        await mkdir(join(target, "spoons"), { recursive: true });
        if (!values["no-install"]) {
            console.log("\nInstalling dependencies (npm install)...\n");
            try {
                execFileSync("npm", ["install"], { cwd: target, stdio: "inherit" });
                installed = true;
            } catch {
                console.error("\nwarning: npm install failed; the project was still created. Run it yourself in the project folder.");
            }
        }
        // With a remote, others install from the repo, so the first commit must include the built spoon.
        if (remote && installed) {
            console.log("\nBuilding the spoon (npm run package)...\n");
            try {
                execFileSync("npm", ["run", "package"], { cwd: target, stdio: "inherit" });
                packaged = true;
            } catch {
                console.error("\nwarning: npm run package failed; run it and commit spoons/ before others install from the repo.");
            }
        }
    }

    let repo = null;
    if (!values["no-git"]) repo = initRepo(target, remote);

    console.log(`\nCreated ${templateKey} spoon "${name}" in ./${rel}`);
    if (repo?.committed) console.log(`Initialized git repository with an initial commit${repo.pushed ? ` and pushed to ${remote}` : ""}.`);
    if (packaged) console.log(`Built spoons/${name}.spoon2 and included it in the commit.`);
    if (repo?.committed && remote && !repo.pushed) console.log(`Push manually when ready: git push -u origin HEAD`);
    console.log();
    if (templateKey === "typescript") {
        console.log(
            [
                "Next steps:",
                `  cd ${rel}`,
                ...(installed ? [] : ["  npm install"]),
                "  Edit src/init.ts",
                "  npm run typecheck   # after every change",
                `  npm run package     # builds spoons/${name}.spoon2`,
                `  Double-click spoons/${name}.spoon2 to install it into Hammerspoon 2`,
                `  In your Hammerspoon 2 config: hs.spoons.load("${name}")`,
            ].join("\n"),
        );
    } else {
        console.log(
            [
                "Next steps:",
                `  cd ${rel}`,
                "  Edit init.js",
                `  Double-click ${rel} in Finder to install it into Hammerspoon 2`,
                `  In your Hammerspoon 2 config: hs.spoons.load("${name}")`,
            ].join("\n"),
        );
    }
}

main().catch((e) => fail(e.message));
