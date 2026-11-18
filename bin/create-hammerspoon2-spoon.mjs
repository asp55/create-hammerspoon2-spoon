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
      --no-install                        TypeScript only: don't run npm install
  -h, --help                              Show this help

<SpoonName> should be PascalCase (e.g. MySpoon). It must start with a letter, contain only letters, digits, "_" and "-",
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

async function main() {
    let parsed;
    try {
        parsed = parseArgs({
            allowPositionals: true,
            options: {
                template: { type: "string", short: "t" },
                author: { type: "string", short: "a" },
                description: { type: "string", short: "d" },
                "no-install": { type: "boolean" },
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
    if (!NAME_PATTERN.test(name)) fail(`invalid spoon name "${name}": use letters, digits, "_" and "-", starting with a letter (PascalCase recommended, e.g. MySpoon)`);
    if (RESERVED_NAMES.has(name)) fail(`"${name}" is reserved: it is the name of an hs.spoons member (reserved: ${[...RESERVED_NAMES].join(", ")})`);

    const templateKey = await chooseTemplate(values.template);
    const template = TEMPLATES[templateKey];
    const description = (await chooseDescription(values.description, name)).replace(/\s+/g, " ").trim();
    const tokens = {
        name,
        identifier: toIdentifier(name),
        // The TypeScript template's package.json is the build project, not the spoon. npm names must be lowercase.
        packageName: `${name.toLowerCase()}-builder`,
        author: values.author ?? (gitAuthor() || "Your Name <you@example.com>"),
        description,
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
    }

    console.log(`\nCreated ${templateKey} spoon "${name}" in ./${rel}\n`);
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
